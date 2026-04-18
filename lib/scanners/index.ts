/**
 * Main Scanner Orchestrator
 * Coordinates all scanner modules and provides a unified API
 * Now runs all scans automatically for comprehensive analysis
 */

import { checkHeaders, checkDNS, checkSSL, calculateSecurityScore } from './security';
import { checkPerformance } from './performance';
import { runPentestScan } from './pentest';
import { runSecurityAudit, type SecurityAuditReport } from './securityAudit';
import type { ScanResult, ScanMode, SecurityFinding } from './types';

export * from './types';
export { checkHeaders, checkDNS, checkSSL, calculateSecurityScore } from './security';
export { checkPerformance } from './performance';
export { runPentestScan } from './pentest';
export { runSecurityAudit, type SecurityAuditReport, type SecurityAuditFinding } from './securityAudit';

export interface ScanOptions {
  mode: ScanMode;
  timeout?: number;
}

function sortFindings(findings: SecurityFinding[]): SecurityFinding[] {
  const severityOrder = { critical: 0, bad: 1, warning: 2, info: 3, good: 4 };
  return findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export interface ComprehensiveScanResult extends ScanResult {
  securityScore: number;
  performanceScore: number;
  pentestScore: number;
  auditScore: number;
  auditReport?: SecurityAuditReport;
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
      const baseResult = {
        mode: 'performance' as const,
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
      return baseResult;
    }

    case 'pentest': {
      const pentest = await runPentestScan(domain, headers, ssl);
      return {
        mode: 'pentest' as const,
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

    case 'audit': {
      // Run comprehensive security audit with real penetration testing
      const auditReport = await runSecurityAudit(`https://${domain}`);
      
      // Convert audit findings to SecurityFinding format
      const auditFindings: SecurityFinding[] = auditReport.findings.map(f => ({
        id: f.id,
        category: f.category === 'xss' ? 'vulnerability' : f.category === 'info_disclosure' ? 'pentest' : f.category,
        title: f.title,
        description: f.description,
        severity: f.severity === 'Critical' ? 'critical' : f.severity === 'High' ? 'bad' : f.severity === 'Medium' ? 'warning' : f.severity === 'Low' ? 'warning' : 'info',
        details: f.evidence,
        recommendation: f.recommendation,
      }));

      // Combine with base findings
      const baseFindings = calculateSecurityScore(headers, dns, ssl).findings;
      const allFindings = sortFindings([...baseFindings, ...auditFindings]);

      // Calculate grade from risk score
      let grade: 'A' | 'B' | 'C' | 'D' | 'F';
      if (auditReport.riskScore >= 90) grade = 'A';
      else if (auditReport.riskScore >= 75) grade = 'B';
      else if (auditReport.riskScore >= 50) grade = 'C';
      else if (auditReport.riskScore >= 25) grade = 'D';
      else grade = 'F';

      return {
        mode: 'security' as const,
        domain,
        score: auditReport.riskScore,
        grade,
        findings: allFindings,
        headers,
        dns,
        ssl,
        scanTime: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }

    case 'security':
    default: {
      const { score, grade, findings } = calculateSecurityScore(headers, dns, ssl);
      return {
        mode: 'security' as const,
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

/**
 * Run comprehensive scan - all modes at once
 * Returns aggregated results from security, performance, pentest, and audit scans
 */
export async function runAllScans(domain: string): Promise<ComprehensiveScanResult> {
  const startTime = Date.now();

  // Run base checks
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

  // Run all specialized scans in parallel
  const [perfResult, pentestResult, auditResult] = await Promise.allSettled([
    checkPerformance(domain),
    runPentestScan(domain, headers, ssl),
    runSecurityAudit(`https://${domain}`),
  ]);

  // Calculate security score from base checks
  const securityCalc = calculateSecurityScore(headers, dns, ssl);
  const securityScore = securityCalc.score;

  // Get performance score
  const performance = perfResult.status === 'fulfilled' ? perfResult.value : null;
  const performanceScore = performance?.score ?? 0;

  // Get pentest score
  const pentest = pentestResult.status === 'fulfilled' ? pentestResult.value : null;
  const pentestScore = pentest?.score ?? 0;

  // Get audit findings
  const auditReport = auditResult.status === 'fulfilled' ? auditResult.value : null;
  const auditScore = auditReport?.riskScore ?? 0;

  // Combine all findings
  const allFindings: SecurityFinding[] = [
    ...securityCalc.findings,
    ...(performance?.findings ?? []),
    ...(pentest?.findings ?? []),
  ];

  // Add audit findings if available
  if (auditReport) {
    const auditFindings: SecurityFinding[] = auditReport.findings.map(f => ({
      id: f.id,
      category: f.category === 'xss' ? 'vulnerability' : f.category === 'info_disclosure' ? 'pentest' : f.category,
      title: f.title,
      description: f.description,
      severity: f.severity === 'Critical' ? 'critical' : f.severity === 'High' ? 'bad' : f.severity === 'Medium' ? 'warning' : f.severity === 'Low' ? 'warning' : 'info',
      details: f.evidence,
      recommendation: f.recommendation,
    }));
    allFindings.push(...auditFindings);
  }

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (securityScore * 0.35) +
    (performanceScore * 0.25) +
    (pentestScore * 0.20) +
    (auditScore * 0.20)
  );

  // Calculate overall grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (overallScore >= 90) grade = 'A';
  else if (overallScore >= 75) grade = 'B';
  else if (overallScore >= 50) grade = 'C';
  else if (overallScore >= 25) grade = 'D';
  else grade = 'F';

  return {
    mode: 'security' as const,
    domain,
    score: overallScore,
    grade,
    findings: sortFindings(allFindings),
    headers,
    dns,
    ssl,
    performance: performance ?? undefined,
    pentest: pentest ? {
      grade: pentest.grade,
      riskScore: pentest.riskScore,
      exposedPorts: pentest.exposedPorts,
      technologies: pentest.technologies,
      subdomains: pentest.subdomains,
      findings: pentest.findings,
    } : undefined,
    auditReport: auditReport ?? undefined,
    // Individual scores for detailed view
    securityScore,
    performanceScore,
    pentestScore,
    auditScore,
    scanTime: new Date().toISOString(),
    duration: Date.now() - startTime,
  };
}
