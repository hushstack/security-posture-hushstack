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

  // 1. Deep Security Header Analysis
  for (const [header, config] of Object.entries(SECURITY_HEADERS)) {
    const value = headers.allHeaders[header];
    if (value) {
      // Basic presence
      findings.push({
        id: `header-${header}`,
        category: 'headers',
        title: `${config.name} Present`,
        description: config.description,
        severity: 'good',
        details: value.length > 100 ? value.substring(0, 100) + '...' : value,
      });

      // Specific policy strength checks
      if (header === 'strict-transport-security') {
        const maxAgeMatch = value.match(/max-age=(\d+)/);
        const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : 0;
        if (maxAge < 15768000) { // < 6 months
          score -= 5;
          findings.push({
            id: 'hsts-weak',
            category: 'headers',
            title: 'Weak HSTS Policy',
            description: 'The HSTS max-age is too short (recommended at least 6 months).',
            severity: 'warning',
            details: value
          });
        }
        if (!value.includes('includeSubDomains')) {
          score -= 2;
          findings.push({
            id: 'hsts-no-subdomains',
            category: 'headers',
            title: 'HSTS Subdomains Missing',
            description: 'HSTS policy does not include subdomains.',
            severity: 'info',
            details: value
          });
        }
      }

      if (header === 'content-security-policy') {
        const insecureDirectives = ["'unsafe-inline'", "'unsafe-eval'", "data:", "*"];
        const foundInsecure = insecureDirectives.filter(d => value.includes(d));
        if (foundInsecure.length > 0) {
          score -= 7;
          findings.push({
            id: 'csp-insecure',
            category: 'headers',
            title: 'Insecure CSP Directives',
            description: `CSP contains insecure directives: ${foundInsecure.join(', ')}. This may allow XSS.`,
            severity: 'warning',
            details: value
          });
        }
      }
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

  // Information Disclosure Headers
  const disclosureHeaders = {
    'server': { name: 'Server', penalty: 5 },
    'x-powered-by': { name: 'X-Powered-By', penalty: 5 },
    'x-aspnet-version': { name: 'X-AspNet-Version', penalty: 5 },
    'via': { name: 'Via', penalty: 2 }
  };

  for (const [header, info] of Object.entries(disclosureHeaders)) {
    const value = headers.allHeaders[header];
    if (value) {
      score -= info.penalty;
      findings.push({
        id: `disclosure-${header}`,
        category: 'headers',
        title: `${info.name} Header Exposed`,
        description: `This header reveals technology stack details (${value}), which helps attackers fingerprint your server.`,
        severity: 'warning',
        details: value,
      });
    }
  }

  // 2. Deep DNS Analysis
  if (dns.spf.present) {
    const record = dns.spf.records[0] || '';
    findings.push({
      id: 'dns-spf',
      category: 'dns',
      title: 'SPF Record Configured',
      description: 'Sender Policy Framework helps prevent email spoofing.',
      severity: 'good',
      details: record,
    });

    // Check for dangerous SPF configurations
    if (record.includes('+all') || record.includes('?all')) {
      score -= 10;
      findings.push({
        id: 'dns-spf-permissive',
        category: 'dns',
        title: 'Permissive SPF Policy',
        description: 'Your SPF record uses "+all" or "?all", which effectively disables SPF protection.',
        severity: 'critical',
        details: record,
      });
    } else if (record.includes('~all')) {
      findings.push({
        id: 'dns-spf-softfail',
        category: 'dns',
        title: 'SPF SoftFail Policy',
        description: 'Using "~all" is common but less secure than "-all" (HardFail).',
        severity: 'info',
        details: record,
      });
    }
  } else {
    score -= 10;
    findings.push({
      id: 'dns-spf-missing',
      category: 'dns',
      title: 'SPF Record Missing',
      description: 'Without SPF, attackers can easily spoof emails from your domain.',
      severity: 'bad',
    });
  }

  if (dns.dmarc.present) {
    const record = dns.dmarc.records[0] || '';
    const policy = dns.dmarc.policy || 'none';
    
    findings.push({
      id: 'dns-dmarc',
      category: 'dns',
      title: `DMARC Policy: ${policy.toUpperCase()}`,
      description: `DMARC is configured with a ${policy} policy.`,
      severity: policy === 'reject' ? 'good' : policy === 'quarantine' ? 'warning' : 'bad',
      details: record,
    });
    
    if (policy === 'none') {
      score -= 10;
      findings.push({
        id: 'dns-dmarc-weak',
        category: 'dns',
        title: 'DMARC Policy is "none"',
        description: 'A policy of "none" only provides monitoring and does not stop spoofing attempts.',
        severity: 'bad',
      });
    }
  } else {
    score -= 15;
    findings.push({
      id: 'dns-dmarc-missing',
      category: 'dns',
      title: 'DMARC Record Missing',
      description: 'DMARC is essential for preventing sophisticated email phishing and spoofing.',
      severity: 'bad',
    });
  }

  // 3. SSL/TLS Rigorous Analysis
  if (ssl) {
    if (ssl.expired) {
      score -= 40;
      findings.push({
        id: 'ssl-expired',
        category: 'ssl',
        title: 'SSL Certificate Expired',
        description: 'Your certificate is expired. Connections are insecure.',
        severity: 'critical',
        details: `Expired on ${ssl.validTo}`,
      });
    } else {
      if (ssl.daysUntilExpiry < 15) {
        score -= 15;
        findings.push({
          id: 'ssl-near-expiry',
          category: 'ssl',
          title: 'SSL Expiring Very Soon',
          description: `The certificate expires in ${ssl.daysUntilExpiry} days. Renew immediately.`,
          severity: 'bad',
        });
      }

      // Protocol version checks
      const tlsVer = ssl.tlsVersion;
      if (tlsVer === 'TLSv1' || tlsVer === 'TLSv1.1') {
        score -= 20;
        findings.push({
          id: 'ssl-old-tls',
          category: 'ssl',
          title: 'Obsolete TLS Version',
          description: `Server uses ${tlsVer}, which is deprecated and contains vulnerabilities.`,
          severity: 'critical',
          details: tlsVer,
        });
      } else if (tlsVer === 'TLSv1.2') {
        findings.push({
          id: 'ssl-tls12',
          category: 'ssl',
          title: 'TLS 1.2 in Use',
          description: 'TLS 1.2 is currently secure but TLS 1.3 is recommended.',
          severity: 'good',
        });
      }
    }

    if (ssl.weakCipher) {
      score -= 15;
      findings.push({
        id: 'ssl-weak-cipher',
        category: 'ssl',
        title: 'Weak Ciphers Supported',
        description: 'Server supports deprecated ciphers like RC4, DES, or MD5.',
        severity: 'critical',
      });
    }
  } else {
    score -= 30;
    findings.push({
      id: 'ssl-failed',
      category: 'ssl',
      title: 'SSL Analysis Failed',
      description: 'Could not establish a secure connection to verify certificate.',
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
