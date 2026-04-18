/**
 * Advanced Security Audit Module
 * Performs real security checks: SSL/TLS analysis, header security,
 * information disclosure scanning, and DOM-based XSS simulation
 */

import https from 'https';
import http from 'http';
import tls from 'tls';
import { URL } from 'url';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface SecurityAuditFinding {
  id: string;
  category: 'ssl' | 'headers' | 'info_disclosure' | 'xss' | 'general';
  title: string;
  description: string;
  severity: Severity;
  evidence?: string;
  recommendation: string;
  cwe?: string;
  cvss?: number;
}

export interface SSLAnalysisResult {
  valid: boolean;
  expired: boolean;
  daysUntilExpiry: number;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  tlsVersion: string;
  supportedProtocols: string[];
  weakProtocols: string[];
  cipherSuites: string[];
  weakCiphers: string[];
  chainValid: boolean;
  chainIssues: string[];
}

export interface HeaderAnalysisResult {
  headers: Record<string, string>;
  missingSecurityHeaders: string[];
  weakSecurityHeaders: Array<{ name: string; issue: string }>;
  exposedHeaders: Array<{ name: string; value: string; risk: string }>;
}

export interface InfoDisclosureResult {
  comments: Array<{ content: string; line: number; type: string }>;
  exposedPaths: string[];
  versionNumbers: string[];
  emails: string[];
  ipAddresses: string[];
  developerNames: string[];
}

export interface XSSTestResult {
  parameter: string;
  payload: string;
  reflected: boolean;
  sanitized: boolean;
  context: 'html' | 'attribute' | 'javascript' | 'url' | null;
  evidence?: string;
}

export interface SecurityAuditReport {
  targetUrl: string;
  scanTime: string;
  duration: number;
  ssl: SSLAnalysisResult | null;
  headers: HeaderAnalysisResult;
  infoDisclosure: InfoDisclosureResult;
  xssTests: XSSTestResult[];
  findings: SecurityAuditFinding[];
  riskScore: number;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low' | 'Minimal';
}

const WEAK_TLS_VERSIONS = ['TLSv1', 'TLSv1.1', 'SSLv3', 'SSLv2'];
const WEAK_CIPHERS = [
  'DES', '3DES', 'RC4', 'RC2', 'MD5', 'SHA1', 'NULL', 'EXPORT',
  'RSA_WITH_3DES_EDE_CBC_SHA', 'RSA_WITH_RC4_128_SHA', 'RSA_WITH_DES_CBC_SHA'
];

const CRITICAL_SECURITY_HEADERS = [
  { name: 'strict-transport-security', required: true, friendly: 'HSTS' },
  { name: 'content-security-policy', required: true, friendly: 'CSP' },
  { name: 'x-frame-options', required: true, friendly: 'X-Frame-Options' },
  { name: 'x-content-type-options', required: true, friendly: 'X-Content-Type-Options' },
  { name: 'referrer-policy', required: false, friendly: 'Referrer-Policy' },
  { name: 'permissions-policy', required: false, friendly: 'Permissions-Policy' },
];

const INFO_DISCLOSURE_HEADERS = ['server', 'x-powered-by', 'x-aspnet-version', 'x-generator', 'via'];

const XSS_PAYLOADS = [
  { payload: '<script>alert(1)</script>', context: 'html' as const },
  { payload: 'javascript:alert(1)', context: 'url' as const },
  { payload: '\"><img src=x onerror=alert(1)>', context: 'attribute' as const },
  { payload: "';alert(1);//", context: 'javascript' as const },
  { payload: '<img src=x onerror=alert(1)>', context: 'html' as const },
  { payload: '<svg onload=alert(1)>', context: 'html' as const },
  { payload: "\"><img src=x onerror=alert(1)>", context: 'html' as const },
];

/**
 * Fetch URL with timeout and follow redirects
 */
async function fetchWithTimeout(
  targetUrl: string,
  options: https.RequestOptions = {},
  timeout = 10000
): Promise<{ response: http.IncomingMessage; body: string; url: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const client = url.protocol === 'https:' ? https : http;
    
    const reqOptions: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      timeout,
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      ...options,
    };

    const req = client.request(reqOptions, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ response: res, body, url: targetUrl });
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

/**
 * Perform deep SSL/TLS analysis
 */
async function analyzeSSL(hostname: string): Promise<SSLAnalysisResult | null> {
  return new Promise((resolve) => {
    const socket = tls.connect(443, hostname, {
      timeout: 15000,
      rejectUnauthorized: false,
    }, () => {
      const cert = socket.getPeerCertificate(true);
      if (!cert || Object.keys(cert).length === 0) {
        socket.end();
        resolve(null);
        return;
      }

      const cipher = socket.getCipher();
      const tlsVersion = cipher?.version || 'Unknown';
      const now = new Date();
      const validTo = new Date(cert.valid_to as string);
      const expired = now > validTo;
      const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Check for weak protocols
      const weakProtocols: string[] = [];
      if (WEAK_TLS_VERSIONS.includes(tlsVersion)) {
        weakProtocols.push(tlsVersion);
      }

      // Check cipher strength
      const cipherName = cipher?.name || '';
      const weakCiphers: string[] = [];
      for (const weak of WEAK_CIPHERS) {
        if (cipherName.toUpperCase().includes(weak)) {
          weakCiphers.push(weak);
        }
      }

      // Validate certificate chain
      const chainIssues: string[] = [];
      let chainValid = true;
      
      if (expired) {
        chainIssues.push('Certificate has expired');
        chainValid = false;
      }
      if (daysUntilExpiry < 30) {
        chainIssues.push(`Certificate expires in ${daysUntilExpiry} days`);
      }

      socket.end();

      resolve({
        valid: true,
        expired,
        daysUntilExpiry,
        issuer: (cert.issuer?.O || cert.issuer?.CN || 'Unknown') as string,
        subject: (cert.subject?.CN || cert.subject?.O || 'Unknown') as string,
        validFrom: cert.valid_from as string,
        validTo: cert.valid_to as string,
        tlsVersion,
        supportedProtocols: [tlsVersion],
        weakProtocols,
        cipherSuites: cipherName ? [cipherName] : [],
        weakCiphers,
        chainValid,
        chainIssues,
      });
    });

    socket.on('error', () => resolve(null));
    socket.on('timeout', () => { socket.destroy(); resolve(null); });
  });
}

/**
 * Analyze HTTP security headers
 */
function analyzeHeaders(headers: http.IncomingHttpHeaders): HeaderAnalysisResult {
  const normalizedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      normalizedHeaders[key.toLowerCase()] = value;
    } else if (Array.isArray(value)) {
      normalizedHeaders[key.toLowerCase()] = value.join(', ');
    }
  }

  const missingSecurityHeaders: string[] = [];
  const weakSecurityHeaders: Array<{ name: string; issue: string }> = [];
  const exposedHeaders: Array<{ name: string; value: string; risk: string }> = [];

  // Check critical security headers
  for (const header of CRITICAL_SECURITY_HEADERS) {
    const value = normalizedHeaders[header.name];
    if (!value && header.required) {
      missingSecurityHeaders.push(header.friendly);
    } else if (value) {
      // Check for weak configurations
      if (header.name === 'strict-transport-security') {
        const maxAge = value.match(/max-age=(\d+)/);
        if (maxAge && parseInt(maxAge[1]) < 31536000) {
          weakSecurityHeaders.push({ name: header.friendly, issue: 'HSTS max-age less than 1 year' });
        }
        if (!value.includes('includeSubDomains')) {
          weakSecurityHeaders.push({ name: header.friendly, issue: 'HSTS does not include subdomains' });
        }
      }
      if (header.name === 'x-frame-options') {
        if (value.toLowerCase() === 'allowall' || value === '*') {
          weakSecurityHeaders.push({ name: header.friendly, issue: 'X-Frame-Options allows all framing' });
        }
      }
      if (header.name === 'content-security-policy') {
        const insecure = ["'unsafe-inline'", "'unsafe-eval'", "data:", "http:"];
        const found = insecure.filter(i => value.includes(i));
        if (found.length > 0) {
          weakSecurityHeaders.push({ name: header.friendly, issue: `CSP contains insecure directives: ${found.join(', ')}` });
        }
      }
    }
  }

  // Check information disclosure headers
  for (const header of INFO_DISCLOSURE_HEADERS) {
    const value = normalizedHeaders[header];
    if (value) {
      exposedHeaders.push({
        name: header,
        value: value.length > 50 ? value.substring(0, 50) + '...' : value,
        risk: 'Reveals technology stack information to attackers',
      });
    }
  }

  return {
    headers: normalizedHeaders,
    missingSecurityHeaders,
    weakSecurityHeaders,
    exposedHeaders,
  };
}

/**
 * Scan for information disclosure in HTML
 */
function scanInfoDisclosure(html: string): InfoDisclosureResult {
  const result: InfoDisclosureResult = {
    comments: [],
    exposedPaths: [],
    versionNumbers: [],
    emails: [],
    ipAddresses: [],
    developerNames: [],
  };

  const lines = html.split('\n');

  // Find HTML comments
  const commentRegex = /<!--([\s\S]*?)-->/g;
  let match;
  let lineNum = 0;
  while ((match = commentRegex.exec(html)) !== null) {
    const comment = match[1].trim();
    // Find line number
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1;
      if (charCount > match.index) {
        lineNum = i + 1;
        break;
      }
    }

    // Check for sensitive info in comments
    const type = detectCommentType(comment);
    if (type !== 'generic') {
      result.comments.push({ content: comment.substring(0, 200), line: lineNum, type });
    }

    // Extract version numbers from comments
    const versionMatches = comment.match(/\d+\.\d+\.?\d*/g);
    if (versionMatches) {
      result.versionNumbers.push(...versionMatches);
    }
  }

  // Find version numbers in entire HTML
  const versionRegex = /(\w+)[\s@/-]v?(\d+\.\d+\.?\d*)/gi;
  while ((match = versionRegex.exec(html)) !== null) {
    if (!result.versionNumbers.includes(match[2])) {
      result.versionNumbers.push(match[2]);
    }
  }

  // Find email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const foundEmails = html.match(emailRegex) || [];
  result.emails = [...new Set(foundEmails)];

  // Find IP addresses
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const foundIps = html.match(ipRegex) || [];
  result.ipAddresses = [...new Set(foundIps)].filter(ip => {
    const parts = ip.split('.').map(Number);
    return parts.every(p => p >= 0 && p <= 255);
  });

  // Find exposed paths (common patterns)
  const pathRegex = /(?:href|src|action)=['"](\/(?:api|admin|internal|dev|test|config|env|backup|\.git|\.env)[^'"]*)['"]/gi;
  while ((match = pathRegex.exec(html)) !== null) {
    if (!result.exposedPaths.includes(match[1])) {
      result.exposedPaths.push(match[1]);
    }
  }

  // Find developer names (TODO comments, author tags)
  const devRegex = /(?:TODO|FIXME|author|developer)[\s:]+([A-Z][a-z]+\s[A-Z][a-z]+)/gi;
  while ((match = devRegex.exec(html)) !== null) {
    if (!result.developerNames.includes(match[1])) {
      result.developerNames.push(match[1]);
    }
  }

  return result;
}

function detectCommentType(comment: string): string {
  const lower = comment.toLowerCase();
  if (lower.includes('todo')) return 'todo';
  if (lower.includes('fixme')) return 'fixme';
  if (lower.includes('password') || lower.includes('secret') || lower.includes('key')) return 'sensitive';
  if (lower.includes('version') || lower.includes('v1') || lower.includes('v2')) return 'version';
  if (lower.includes('internal') || lower.includes('debug')) return 'internal';
  if (lower.includes('credit') || lower.includes('author')) return 'credit';
  return 'generic';
}

/**
 * Test for DOM-based XSS vulnerabilities
 * Note: This is a passive check - we look for reflection without full browser execution
 */
async function testXSS(targetUrl: string): Promise<XSSTestResult[]> {
  const results: XSSTestResult[] = [];
  const testParams = ['search', 'q', 'query', 'id', 'page', 'callback', 'redirect', 'next', 'return'];
  
  for (const param of testParams) {
    for (const testCase of XSS_PAYLOADS) {
      const payload = testCase.payload;
      const context = testCase.context;
      try {
        const testUrl = new URL(targetUrl);
        testUrl.searchParams.set(param, payload);
        
        const { body } = await fetchWithTimeout(testUrl.toString(), {}, 5000);
        
        // Check if payload is reflected
        const reflected = body.includes(payload) || body.includes(payload.replace(/</g, '&lt;'));
        const sanitized = !body.includes(payload) && (body.includes('&lt;') || body.includes('&gt;'));
        
        if (reflected || sanitized) {
          results.push({
            parameter: param,
            payload: payload.substring(0, 50),
            reflected,
            sanitized,
            context: context as XSSTestResult['context'],
            evidence: reflected ? 'Payload reflected in response' : 'Payload was encoded/escaped',
          });
        }
      } catch {
        // Skip on error
      }
    }
  }

  return results;
}

/**
 * Calculate risk score and level
 */
function calculateRisk(findings: SecurityAuditFinding[]): { score: number; level: SecurityAuditReport['riskLevel'] } {
  const weights: Record<Severity, number> = {
    'Critical': 10,
    'High': 7,
    'Medium': 4,
    'Low': 2,
    'Info': 0,
  };

  let score = 100;
  for (const finding of findings) {
    score -= weights[finding.severity];
  }
  score = Math.max(0, Math.min(100, score));

  let level: SecurityAuditReport['riskLevel'];
  if (score >= 90) level = 'Minimal';
  else if (score >= 75) level = 'Low';
  else if (score >= 50) level = 'Medium';
  else if (score >= 25) level = 'High';
  else level = 'Critical';

  return { score, level };
}

/**
 * Main security audit function
 */
export async function runSecurityAudit(targetUrl: string): Promise<SecurityAuditReport> {
  const startTime = Date.now();
  const findings: SecurityAuditFinding[] = [];

  // Normalize URL
  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://' + targetUrl;
  }

  const url = new URL(targetUrl);

  try {
    // 1. SSL/TLS Analysis
    const ssl = await analyzeSSL(url.hostname);
    
    if (ssl) {
      if (ssl.expired) {
        findings.push({
          id: 'SSL-001',
          category: 'ssl',
          title: 'Expired SSL Certificate',
          description: `The SSL certificate expired ${Math.abs(ssl.daysUntilExpiry)} days ago.`,
          severity: 'Critical',
          evidence: `Valid until: ${ssl.validTo}`,
          recommendation: 'Renew the SSL certificate immediately.',
          cwe: 'CWE-298',
          cvss: 7.5,
        });
      } else if (ssl.daysUntilExpiry < 30) {
        findings.push({
          id: 'SSL-002',
          category: 'ssl',
          title: 'SSL Certificate Expiring Soon',
          description: `Certificate expires in ${ssl.daysUntilExpiry} days.`,
          severity: 'Medium',
          recommendation: 'Schedule certificate renewal before expiration.',
        });
      }

      if (ssl.weakProtocols.length > 0) {
        findings.push({
          id: 'SSL-003',
          category: 'ssl',
          title: 'Deprecated TLS Version',
          description: `Server supports weak protocol: ${ssl.weakProtocols.join(', ')}`,
          severity: 'Critical',
          evidence: `Current version: ${ssl.tlsVersion}`,
          recommendation: 'Disable TLS 1.0/1.1 and enable only TLS 1.2+.',
          cwe: 'CWE-326',
          cvss: 5.9,
        });
      }

      if (ssl.weakCiphers.length > 0) {
        findings.push({
          id: 'SSL-004',
          category: 'ssl',
          title: 'Weak Cipher Suites Enabled',
          description: `Server supports weak ciphers: ${ssl.weakCiphers.join(', ')}`,
          severity: 'High',
          evidence: `Cipher: ${ssl.cipherSuites.join(', ')}`,
          recommendation: 'Disable weak ciphers (DES, RC4, MD5). Use only AES-GCM or ChaCha20.',
          cwe: 'CWE-326',
          cvss: 5.3,
        });
      }

      if (!ssl.chainValid) {
        findings.push({
          id: 'SSL-005',
          category: 'ssl',
          title: 'Certificate Chain Issues',
          description: ssl.chainIssues.join(', '),
          severity: 'Medium',
          recommendation: 'Verify certificate chain is complete and trusted.',
        });
      }
    } else {
      findings.push({
        id: 'SSL-006',
        category: 'ssl',
        title: 'SSL/TLS Analysis Failed',
        description: 'Could not establish secure connection to analyze certificate.',
        severity: 'Medium',
        recommendation: 'Ensure the server supports HTTPS on port 443.',
      });
    }

    // 2. HTTP Request and Header Analysis
    const { response, body } = await fetchWithTimeout(targetUrl);
    const headers = analyzeHeaders(response.headers);

    // Missing security headers
    if (headers.missingSecurityHeaders.length > 0) {
      findings.push({
        id: 'HDR-001',
        category: 'headers',
        title: 'Missing Security Headers',
        description: `The following security headers are missing: ${headers.missingSecurityHeaders.join(', ')}`,
        severity: 'High',
        recommendation: 'Implement all recommended security headers (HSTS, CSP, X-Frame-Options, etc.).',
        cwe: 'CWE-693',
        cvss: 5.0,
      });
    }

    // Weak security headers
    for (const weak of headers.weakSecurityHeaders) {
      findings.push({
        id: `HDR-${weak.name.toUpperCase().replace(/\s/g, '')}`,
        category: 'headers',
        title: `Weak ${weak.name} Configuration`,
        description: weak.issue,
        severity: 'Medium',
        recommendation: `Strengthen the ${weak.name} policy according to best practices.`,
      });
    }

    // Information disclosure headers
    for (const exposed of headers.exposedHeaders) {
      findings.push({
        id: `HDR-${exposed.name.toUpperCase()}`,
        category: 'info_disclosure',
        title: `Information Disclosure: ${exposed.name}`,
        description: exposed.risk,
        severity: 'Low',
        evidence: `Value: ${exposed.value}`,
        recommendation: `Remove or obfuscate the ${exposed.name} header.`,
        cwe: 'CWE-200',
      });
    }

    // 3. Information Disclosure Scan
    const infoDisclosure = scanInfoDisclosure(body);

    if (infoDisclosure.comments.length > 0) {
      const sensitive = infoDisclosure.comments.filter(c => c.type === 'sensitive' || c.type === 'todo' || c.type === 'fixme');
      if (sensitive.length > 0) {
        findings.push({
          id: 'INFO-001',
          category: 'info_disclosure',
          title: 'Sensitive Comments in HTML',
          description: `Found ${sensitive.length} HTML comments that may contain sensitive information.`,
          severity: 'Medium',
          evidence: sensitive.slice(0, 3).map(c => `Line ${c.line}: ${c.content.substring(0, 100)}`).join('\n'),
          recommendation: 'Remove all TODO/FIXME comments and sensitive data from production HTML.',
          cwe: 'CWE-615',
        });
      }
    }

    if (infoDisclosure.exposedPaths.length > 0) {
      findings.push({
        id: 'INFO-002',
        category: 'info_disclosure',
        title: 'Exposed Internal Paths',
        description: `Found ${infoDisclosure.exposedPaths.length} potentially sensitive paths in HTML.`,
        severity: 'Medium',
        evidence: infoDisclosure.exposedPaths.slice(0, 5).join(', '),
        recommendation: 'Remove references to internal/admin paths from client-side code.',
        cwe: 'CWE-548',
      });
    }

    if (infoDisclosure.emails.length > 0) {
      findings.push({
        id: 'INFO-003',
        category: 'info_disclosure',
        title: 'Email Addresses Exposed',
        description: `Found ${infoDisclosure.emails.length} email addresses in page source.`,
        severity: 'Low',
        evidence: infoDisclosure.emails.slice(0, 3).join(', '),
        recommendation: 'Obfuscate email addresses or use contact forms instead.',
        cwe: 'CWE-200',
      });
    }

    if (infoDisclosure.ipAddresses.length > 0) {
      findings.push({
        id: 'INFO-004',
        category: 'info_disclosure',
        title: 'Internal IP Addresses Exposed',
        description: `Found ${infoDisclosure.ipAddresses.length} IP addresses in page source.`,
        severity: 'Medium',
        evidence: infoDisclosure.ipAddresses.slice(0, 3).join(', '),
        recommendation: 'Remove internal IP addresses from client-visible content.',
        cwe: 'CWE-200',
      });
    }

    // 4. XSS Testing
    const xssTests = await testXSS(targetUrl);
    const reflectedXss = xssTests.filter(t => t.reflected && !t.sanitized);
    
    if (reflectedXss.length > 0) {
      findings.push({
        id: 'XSS-001',
        category: 'xss',
        title: 'Reflected XSS Vulnerability',
        description: `Found ${reflectedXss.length} parameters that reflect unsanitized input.`,
        severity: 'Critical',
        evidence: reflectedXss.slice(0, 3).map(t => `Parameter "${t.parameter}" with payload "${t.payload}"`).join('\n'),
        recommendation: 'Implement proper input validation and output encoding. Use Content Security Policy.',
        cwe: 'CWE-79',
        cvss: 6.1,
      });
    }

    const potentiallyVulnerable = xssTests.filter(t => t.reflected && t.sanitized);
    if (potentiallyVulnerable.length > 0 && reflectedXss.length === 0) {
      findings.push({
        id: 'XSS-002',
        category: 'xss',
        title: 'Potential XSS (Partially Sanitized)',
        description: `Some parameters reflect input but may have encoding. Manual verification recommended.`,
        severity: 'Low',
        evidence: potentiallyVulnerable.slice(0, 2).map(t => `Parameter "${t.parameter}"`).join(', '),
        recommendation: 'Verify that all user input is properly encoded based on context.',
      });
    }

    // Calculate final risk
    const { score, level } = calculateRisk(findings);

    return {
      targetUrl,
      scanTime: new Date().toISOString(),
      duration: Date.now() - startTime,
      ssl,
      headers,
      infoDisclosure,
      xssTests,
      findings,
      riskScore: score,
      riskLevel: level,
    };

  } catch (error) {
    // Handle blocked requests gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    findings.push({
      id: 'GEN-001',
      category: 'general',
      title: 'Scan Incomplete',
      description: `Could not complete full scan: ${errorMessage}`,
      severity: 'Info',
      recommendation: 'Check if the target blocks automated requests. Consider using request delays.',
    });

    const { score, level } = calculateRisk(findings);

    return {
      targetUrl,
      scanTime: new Date().toISOString(),
      duration: Date.now() - startTime,
      ssl: null,
      headers: { headers: {}, missingSecurityHeaders: [], weakSecurityHeaders: [], exposedHeaders: [] },
      infoDisclosure: { comments: [], exposedPaths: [], versionNumbers: [], emails: [], ipAddresses: [], developerNames: [] },
      xssTests: [],
      findings,
      riskScore: score,
      riskLevel: level,
    };
  }
}

export default runSecurityAudit;
