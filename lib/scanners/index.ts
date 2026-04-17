/**
 * Main Scanner Orchestrator
 * Coordinates all scanner modules and provides a unified API
 */

import { checkHeaders, checkDNS, checkSSL, calculateSecurityScore } from './security';
import { checkPerformance } from './performance';
import { runPentestScan } from './pentest';
import type { ScanResult, ScanMode, ScanRequest, SecurityFinding } from './types';

export * from './types';
export { checkHeaders, checkDNS, checkSSL, calculateSecurityScore } from './security';
export { checkPerformance } from './performance';
export { runPentestScan } from './pentest';

export interface ScanOptions {
  mode: ScanMode;
  timeout?: number;
}

function sortFindings(findings: SecurityFinding[]): SecurityFinding[] {
  const severityOrder = { critical: 0, bad: 1, warning: 2, info: 3, good: 4 };
  return findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export async function runScan(domain: string, options: ScanOptions): Promise<ScanResult> {
  const startTime = Date.now();
  const { mode } = options;

  // Run base checks for all modes
  const [headersResult, dnsResult, sslResult] = await Promise.allSettled([
    checkHeaders(domain),
    checkDNS(domain),
    checkSSL(domain),
  ]);

  const headers = headersResult.status === 'fulfilled' ? headersResult.value : { allHeaders: {} };
  const dns = dnsResult.status === 'fulfilled' ? dnsResult.value : {
    spf: { present: false, records: [] },
    dmarc: { present: false, records: [] },
    mx: { present: false, records: [] },
    txt: [],
    ns: [],
    a: [],
  };
  const ssl = sslResult.status === 'fulfilled' ? sslResult.value : null;

  // Mode-specific scanning
  switch (mode) {
    case 'performance': {
      const perf = await checkPerformance(domain);
      return {
        mode: 'performance',
        domain,
        score: perf.score,
        grade: perf.grade,
        findings: sortFindings(perf.findings),
        headers,
        dns,
        ssl,
        performance: perf,
        scanTime: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }

    case 'pentest': {
      const pentest = await runPentestScan(domain, headers, ssl);
      return {
        mode: 'pentest',
        domain,
        score: pentest.score,
        grade: pentest.grade,
        findings: sortFindings(pentest.findings),
        headers,
        dns,
        ssl,
        pentest: {
          grade: pentest.grade,
          riskScore: pentest.riskScore,
          exposedPorts: pentest.exposedPorts,
          technologies: pentest.technologies,
          subdomains: pentest.subdomains,
          findings: pentest.findings,
        },
        scanTime: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }

    case 'security':
    default: {
      const { score, grade, findings } = calculateSecurityScore(headers, dns, ssl);
      return {
        mode: 'security',
        domain,
        score,
        grade,
        findings: sortFindings(findings),
        headers,
        dns,
        ssl,
        scanTime: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }
  }
}
