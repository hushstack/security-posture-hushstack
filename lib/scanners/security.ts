/**
 * Security Scanner Module
 * Handles HTTP headers, SSL/TLS, and DNS security checks
 */

import https from 'https';
import dns from 'dns';
import tls from 'tls';
import { promisify } from 'util';
import type {
  SecurityFinding,
  HeadersInfo,
  DNSRecords,
  SSLInfo,
  SecurityGrade,
} from './types';

const dnsResolveTxt = promisify(dns.resolveTxt);
const dnsResolveMx = promisify(dns.resolveMx);

const SECURITY_HEADERS = {
  'strict-transport-security': {
    name: 'Strict-Transport-Security (HSTS)',
    description: 'Forces browsers to use HTTPS connections, preventing downgrade attacks.',
    penalty: 10,
  },
  'content-security-policy': {
    name: 'Content-Security-Policy (CSP)',
    description: 'Prevents XSS and data injection attacks by controlling resource loading.',
    penalty: 15,
  },
  'x-frame-options': {
    name: 'X-Frame-Options',
    description: 'Prevents clickjacking attacks by controlling iframe embedding.',
    penalty: 10,
  },
  'x-content-type-options': {
    name: 'X-Content-Type-Options',
    description: 'Prevents MIME type sniffing attacks.',
    penalty: 5,
  },
} as const;

export async function checkHeaders(domain: string): Promise<HeadersInfo> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: domain,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 10000,
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      const headers = res.headers;
      const allHeaders: Record<string, string> = {};

      for (const [key, value] of Object.entries(headers)) {
        if (typeof value === 'string') {
          allHeaders[key] = value;
        } else if (Array.isArray(value)) {
          allHeaders[key] = value.join(', ');
        }
      }

      resolve({
        strictTransportSecurity: headers['strict-transport-security'] as string | undefined,
        contentSecurityPolicy: headers['content-security-policy'] as string | undefined,
        xFrameOptions: headers['x-frame-options'] as string | undefined,
        xContentTypeOptions: headers['x-content-type-options'] as string | undefined,
        xXssProtection: headers['x-xss-protection'] as string | undefined,
        referrerPolicy: headers['referrer-policy'] as string | undefined,
        permissionsPolicy: headers['permissions-policy'] as string | undefined,
        cacheControl: headers['cache-control'] as string | undefined,
        etag: headers['etag'] as string | undefined,
        lastModified: headers['last-modified'] as string | undefined,
        server: headers['server'] as string | undefined,
        xPoweredBy: headers['x-powered-by'] as string | undefined,
        via: headers['via'] as string | undefined,
        allHeaders,
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

export async function checkDNS(domain: string): Promise<DNSRecords> {
  const result: DNSRecords = {
    spf: { present: false, records: [] },
    dmarc: { present: false, records: [] },
    mx: { present: false, records: [] },
    txt: [],
    ns: [],
    a: [],
  };

  try {
    const txtRecords = await dnsResolveTxt(domain);
    
    for (const record of txtRecords) {
      const recordText = record.join('');
      result.txt.push(recordText);
      
      if (recordText.toLowerCase().includes('v=spf1')) {
        result.spf.present = true;
        result.spf.records.push(recordText);
      }
    }

    // Check DMARC
    try {
      const dmarcRecords = await dnsResolveTxt(`_dmarc.${domain}`);
      for (const record of dmarcRecords) {
        const recordText = record.join('');
        if (recordText.toLowerCase().includes('v=dmarc1')) {
          result.dmarc.present = true;
          result.dmarc.records.push(recordText);
          
          const policyMatch = recordText.match(/p=(none|quarantine|reject)/i);
          if (policyMatch) {
            result.dmarc.policy = policyMatch[1].toLowerCase();
          }
        }
      }
    } catch {
      // DMARC not configured
    }
  } catch {
    // DNS lookup failed
  }

  // Check MX records
  try {
    const mxRecords = await dnsResolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      result.mx.present = true;
      result.mx.records = mxRecords.map(mx => `${mx.priority} ${mx.exchange}`);
    }
  } catch {
    // No MX records
  }

  return result;
}

export async function checkSSL(domain: string): Promise<SSLInfo | null> {
  return new Promise((resolve) => {
    const socket = tls.connect(443, domain, {
      timeout: 10000,
      rejectUnauthorized: false,
    }, () => {
      const cert = socket.getPeerCertificate(true);
      
      if (!cert || Object.keys(cert).length === 0) {
        socket.end();
        resolve(null);
        return;
      }

      const now = new Date();
      const validTo = new Date(cert.valid_to as string);
      const expired = now > validTo;
      const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const getCertString = (val: string | string[] | undefined): string | undefined => {
        if (Array.isArray(val)) return val[0];
        return val;
      };

      // Get TLS version
      const tlsVersion = socket.getCipher()?.version;
      
      // Check for weak ciphers
      const cipher = socket.getCipher();
      const weakCipher = !cipher || 
        cipher.name?.includes('DES') || 
        cipher.name?.includes('3DES') ||
        cipher.name?.includes('RC4') ||
        cipher.name?.includes('MD5');

      socket.end();
      
      resolve({
        valid: true,
        expired,
        daysUntilExpiry,
        issuer: getCertString(cert.issuer?.CN) || getCertString(cert.issuer?.O) || 'Unknown',
        subject: getCertString(cert.subject?.CN) || getCertString(cert.subject?.O) || 'Unknown',
        validFrom: cert.valid_from as string,
        validTo: cert.valid_to as string,
        tlsVersion,
        weakCipher,
      });
    });

    socket.on('error', () => {
      resolve(null);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(null);
    });
  });
}

export function calculateSecurityScore(
  headers: HeadersInfo,
  dns: DNSRecords,
  ssl: SSLInfo | null
): { score: number; grade: SecurityGrade; findings: SecurityFinding[] } {
  let score = 100;
  const findings: SecurityFinding[] = [];

  // Check security headers
  for (const [header, config] of Object.entries(SECURITY_HEADERS)) {
    const headerValue = headers.allHeaders[header];
    if (headerValue) {
      findings.push({
        id: `header-${header}`,
        category: 'headers',
        title: `${config.name} Present`,
        description: config.description,
        severity: 'good',
        details: headerValue.substring(0, 100),
      });
    } else {
      score -= config.penalty;
      findings.push({
        id: `header-${header}`,
        category: 'headers',
        title: `${config.name} Missing`,
        description: config.description,
        severity: 'bad',
      });
    }
  }

  // Server header fingerprinting (info disclosure)
  if (headers.server) {
    findings.push({
      id: 'header-server',
      category: 'headers',
      title: 'Server Header Exposed',
      description: `Server software identified: ${headers.server}`,
      severity: 'warning',
      details: headers.server,
    });
    score -= 2;
  }

  if (headers.xPoweredBy) {
    findings.push({
      id: 'header-xpoweredby',
      category: 'headers',
      title: 'X-Powered-By Header Exposed',
      description: `Technology stack identified: ${headers.xPoweredBy}`,
      severity: 'warning',
      details: headers.xPoweredBy,
    });
    score -= 2;
  }

  // DNS checks
  if (dns.spf.present) {
    findings.push({
      id: 'dns-spf',
      category: 'dns',
      title: 'SPF Record Configured',
      description: 'Sender Policy Framework helps prevent email spoofing.',
      severity: 'good',
      details: dns.spf.records[0]?.substring(0, 100),
    });
  } else {
    score -= 10;
    findings.push({
      id: 'dns-spf',
      category: 'dns',
      title: 'SPF Record Missing',
      description: 'SPF records help prevent email spoofing and improve email deliverability.',
      severity: 'bad',
    });
  }

  if (dns.dmarc.present) {
    const policyStrength = dns.dmarc.policy === 'reject' ? 'strong' : 
                          dns.dmarc.policy === 'quarantine' ? 'moderate' : 'weak';
    findings.push({
      id: 'dns-dmarc',
      category: 'dns',
      title: 'DMARC Record Configured',
      description: `Domain-based Message Authentication with ${policyStrength} policy (${dns.dmarc.policy || 'none'}).`,
      severity: dns.dmarc.policy === 'reject' ? 'good' : 'warning',
      details: dns.dmarc.records[0]?.substring(0, 100),
    });
    
    if (dns.dmarc.policy === 'none') {
      score -= 5;
    }
  } else {
    score -= 15;
    findings.push({
      id: 'dns-dmarc',
      category: 'dns',
      title: 'DMARC Record Missing',
      description: 'DMARC builds on SPF to provide stronger email authentication.',
      severity: 'bad',
    });
  }

  // SSL checks
  if (ssl) {
    if (ssl.expired) {
      score -= 25;
      findings.push({
        id: 'ssl-expired',
        category: 'ssl',
        title: 'SSL Certificate Expired',
        description: 'The SSL certificate has expired. Browsers will show security warnings.',
        severity: 'bad',
        details: `Expired on ${new Date(ssl.validTo).toLocaleDateString()}`,
      });
    } else if (ssl.daysUntilExpiry < 30) {
      score -= 10;
      findings.push({
        id: 'ssl-expiring',
        category: 'ssl',
        title: 'SSL Certificate Expiring Soon',
        description: 'The SSL certificate will expire within 30 days.',
        severity: 'warning',
        details: `Expires in ${ssl.daysUntilExpiry} days`,
      });
    } else {
      findings.push({
        id: 'ssl-valid',
        category: 'ssl',
        title: 'Valid SSL Certificate',
        description: `SSL certificate is valid and expires in ${ssl.daysUntilExpiry} days.`,
        severity: 'good',
        details: `Issuer: ${ssl.issuer}`,
      });
    }

    if (ssl.weakCipher) {
      score -= 10;
      findings.push({
        id: 'ssl-weak-cipher',
        category: 'ssl',
        title: 'Weak Cipher Suite',
        description: 'Server supports weak or deprecated cipher suites.',
        severity: 'warning',
      });
    }
  } else {
    score -= 30;
    findings.push({
      id: 'ssl-missing',
      category: 'ssl',
      title: 'SSL Certificate Issue',
      description: 'Could not retrieve a valid SSL certificate.',
      severity: 'bad',
    });
  }

  score = Math.max(0, Math.min(100, score));

  let grade: SecurityGrade;
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score, grade, findings };
}
