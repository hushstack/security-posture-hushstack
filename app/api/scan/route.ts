import { type NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';
import net from 'net';
import dns from 'dns';
import tls from 'tls';
import { promisify } from 'util';
import type {
  ScanResult,
  SecurityFinding,
  HeadersInfo,
  DNSRecords,
  SSLInfo,
  SecurityGrade,
  PerformanceGrade,
  PentestGrade,
  ScanMode,
  PerformanceMetrics,
  PerformanceResult,
  PentestResult,
  PortInfo,
  TechnologyStack,
  SubdomainInfo,
} from '@/app/types/scan';

const dnsResolveTxt = promisify(dns.resolveTxt);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveNs = promisify(dns.resolveNs);
const dnsResolveA = promisify(dns.resolve4);

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
    description: 'Prevents MIME sniffing attacks by requiring declared content types.',
    penalty: 5,
  },
};

function validateDomain(domain: string): string | null {
  // Strip protocol and path, extract just the domain
  let cleanDomain = domain.trim().toLowerCase();
  
  // Remove protocol
  cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
  cleanDomain = cleanDomain.replace(/^\//, '');
  
  // Remove path, query params, and hash
  cleanDomain = cleanDomain.split('/')[0];
  cleanDomain = cleanDomain.split('?')[0];
  cleanDomain = cleanDomain.split('#')[0];
  
  // Remove port if present
  cleanDomain = cleanDomain.split(':')[0];
  
  // Validate domain format
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;
  
  if (!cleanDomain || cleanDomain.length < 1 || cleanDomain.length > 253) {
    return null;
  }
  
  if (!domainRegex.test(cleanDomain)) {
    return null;
  }
  
  return cleanDomain;
}

async function checkHeaders(domain: string): Promise<HeadersInfo> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: domain,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 10000,
      rejectUnauthorized: false, // Allow self-signed certs for info gathering
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
        server: headers['server'] as string | undefined,
        xPoweredBy: headers['x-powered-by'] as string | undefined,
        allHeaders,
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function checkDNS(domain: string): Promise<DNSRecords> {
  const result: DNSRecords = {
    spf: { present: false, records: [] },
    dmarc: { present: false, records: [] },
    mx: { present: false, records: [] },
    txt: [],
    ns: [],
    a: [],
  };

  try {
    // Check TXT records for SPF and DMARC
    const txtRecords = await dnsResolveTxt(domain);
    
    for (const record of txtRecords) {
      const recordText = record.join('');
      
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
          
          // Extract policy
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

async function checkSSL(domain: string): Promise<SSLInfo | null> {
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

      // Helper to safely extract string value from certificate field
      const getCertString = (val: string | string[] | undefined): string | undefined => {
        if (Array.isArray(val)) return val[0];
        return val;
      };

      socket.end();
      
      resolve({
        valid: true,
        expired,
        daysUntilExpiry,
        issuer: getCertString(cert.issuer?.CN) || getCertString(cert.issuer?.O) || 'Unknown',
        subject: getCertString(cert.subject?.CN) || getCertString(cert.subject?.O) || 'Unknown',
        validFrom: cert.valid_from as string,
        validTo: cert.valid_to as string,
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

function calculateScoreAndFindings(
  headers: HeadersInfo,
  dns: DNSRecords,
  ssl: SSLInfo | null
): { score: number; grade: SecurityGrade; findings: SecurityFinding[] } {
  let score = 100;
  const findings: SecurityFinding[] = [];

  // Check security headers
  const headerEntries = Object.entries(SECURITY_HEADERS);
  for (const [headerKey, headerInfo] of headerEntries) {
    const headerValue = headers.allHeaders[headerKey.toLowerCase()];
    
    if (headerValue) {
      findings.push({
        id: `header-${headerKey}`,
        category: 'headers',
        title: `${headerInfo.name} Present`,
        description: headerInfo.description,
        severity: 'good',
        details: headerValue.substring(0, 100),
      });
    } else {
      score -= headerInfo.penalty;
      findings.push({
        id: `header-${headerKey}`,
        category: 'headers',
        title: `${headerInfo.name} Missing`,
        description: `${headerInfo.description} This header is not set.`,
        severity: 'bad',
      });
    }
  }

  // Check for information disclosure headers
  if (headers.server) {
    findings.push({
      id: 'header-server',
      category: 'headers',
      title: 'Server Header Discloses Information',
      description: 'The Server header exposes server software details which could aid attackers.',
      severity: 'warning',
      details: headers.server,
    });
    score -= 2;
  }

  if (headers.xPoweredBy) {
    findings.push({
      id: 'header-x-powered-by',
      category: 'headers',
      title: 'X-Powered-By Header Discloses Technology',
      description: 'The X-Powered-By header reveals backend technology information.',
      severity: 'warning',
      details: headers.xPoweredBy,
    });
    score -= 2;
  }

  // Check DNS records
  if (dns.spf.present) {
    findings.push({
      id: 'dns-spf',
      category: 'dns',
      title: 'SPF Record Configured',
      description: 'Sender Policy Framework helps prevent email spoofing by specifying authorized mail servers.',
      severity: 'good',
      details: dns.spf.records[0]?.substring(0, 100),
    });
  } else {
    score -= 10;
    findings.push({
      id: 'dns-spf',
      category: 'dns',
      title: 'SPF Record Missing',
      description: 'Without SPF records, your domain is vulnerable to email spoofing attacks.',
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
      description: `Domain-based Message Authentication with ${policyStrength} policy (${dns.dmarc.policy || 'none'}). Protects against email spoofing.`,
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
      description: 'DMARC builds on SPF to provide stronger email authentication and reporting.',
      severity: 'bad',
    });
  }

  // Check SSL
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
  } else {
    score -= 30;
    findings.push({
      id: 'ssl-missing',
      category: 'ssl',
      title: 'SSL Certificate Issue',
      description: 'Could not retrieve a valid SSL certificate. The site may not support HTTPS.',
      severity: 'bad',
    });
  }

  // Ensure score stays within bounds
  score = Math.max(0, Math.min(100, score));

  // Calculate grade
  let grade: SecurityGrade;
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score, grade, findings };
}

// ==================== PERFORMANCE SCANNING ====================

async function checkPerformance(domain: string): Promise<{ metrics: PerformanceMetrics; findings: SecurityFinding[]; score: number; grade: PerformanceGrade }> {
  const findings: SecurityFinding[] = [];
  
  // Check both HTTP and HTTPS response times
  const [httpResult, httpsResult] = await Promise.allSettled([
    measureResponseTime(domain, false),
    measureResponseTime(domain, true),
  ]);

  const httpsData = httpsResult.status === 'fulfilled' ? httpsResult.value : null;
  const httpData = httpResult.status === 'fulfilled' ? httpResult.value : null;

  // Use HTTPS data as primary, fallback to HTTP
  const primaryData = httpsData || httpData;
  
  if (!primaryData) {
    findings.push({
      id: 'perf-connection-failed',
      category: 'performance',
      title: 'Connection Failed',
      description: 'Could not connect to server to measure performance metrics.',
      severity: 'bad',
    });
    
    return {
      metrics: {
        responseTime: 0,
        ttfb: 0,
        totalLoadTime: 0,
        pageSize: 0,
        resourceCount: 0,
        compressionEnabled: false,
        cacheHeaders: false,
        httpVersion: 'unknown',
      },
      findings,
      score: 0,
      grade: 'F',
    };
  }

  // Calculate performance score (start at 100)
  let score = 100;

  // Response time scoring
  const responseTime = primaryData.responseTime;
  const route = `${primaryData.protocol}://${domain}${primaryData.path}`;
  if (responseTime < 200) {
    findings.push({
      id: 'perf-response-time',
      category: 'performance',
      title: 'Excellent Response Time',
      description: `Server responded in ${responseTime}ms - Very fast!`,
      severity: 'good',
      details: `Route: ${route} | TTFB: ${primaryData.ttfb}ms`,
    });
  } else if (responseTime < 500) {
    score -= 10;
    findings.push({
      id: 'perf-response-time',
      category: 'performance',
      title: 'Good Response Time',
      description: `Server responded in ${responseTime}ms - Acceptable performance.`,
      severity: 'good',
      details: `Route: ${route} | TTFB: ${primaryData.ttfb}ms`,
    });
  } else if (responseTime < 1000) {
    score -= 25;
    findings.push({
      id: 'perf-response-time',
      category: 'performance',
      title: 'Slow Response Time',
      description: `Server responded in ${responseTime}ms - Consider optimization.`,
      severity: 'warning',
      details: `Route: ${route} | TTFB: ${primaryData.ttfb}ms`,
    });
  } else {
    score -= 40;
    findings.push({
      id: 'perf-response-time',
      category: 'performance',
      title: 'Very Slow Response Time',
      description: `Server responded in ${responseTime}ms - Performance needs immediate attention.`,
      severity: 'bad',
      details: `Route: ${route} | TTFB: ${primaryData.ttfb}ms`,
    });
  }

  // Check compression
  if (primaryData.compressionEnabled) {
    findings.push({
      id: 'perf-compression',
      category: 'performance',
      title: 'Compression Enabled',
      description: 'Gzip/Brotli compression is enabled, reducing transfer size.',
      severity: 'good',
    });
  } else {
    score -= 15;
    findings.push({
      id: 'perf-compression',
      category: 'performance',
      title: 'Compression Not Enabled',
      description: 'Enable Gzip or Brotli compression to reduce page load times.',
      severity: 'warning',
    });
  }

  // Check caching headers
  if (primaryData.cacheHeaders) {
    findings.push({
      id: 'perf-caching',
      category: 'performance',
      title: 'Caching Headers Present',
      description: 'Proper cache-control headers are configured.',
      severity: 'good',
    });
  } else {
    score -= 10;
    findings.push({
      id: 'perf-caching',
      category: 'performance',
      title: 'Caching Headers Missing',
      description: 'Add cache-control headers to improve repeat visit performance.',
      severity: 'warning',
    });
  }

  // HTTP/2 or HTTP/3 check
  if (primaryData.httpVersion === 'HTTP/2' || primaryData.httpVersion === 'HTTP/3') {
    findings.push({
      id: 'perf-http-version',
      category: 'performance',
      title: `Modern HTTP Version (${primaryData.httpVersion})`,
      description: 'Using modern HTTP protocol for better performance.',
      severity: 'good',
    });
  } else if (primaryData.httpVersion === 'HTTP/1.1') {
    score -= 10;
    findings.push({
      id: 'perf-http-version',
      category: 'performance',
      title: 'Legacy HTTP/1.1',
      description: 'Consider upgrading to HTTP/2 or HTTP/3 for better performance.',
      severity: 'warning',
    });
  }

  // HTTPS redirect check
  if (httpData && httpsData) {
    findings.push({
      id: 'perf-https-available',
      category: 'performance',
      title: 'HTTPS Available',
      description: 'Both HTTP and HTTPS endpoints are accessible.',
      severity: 'info',
    });
  }

  // Page size estimation (based on content-length or rough estimate)
  const pageSize = primaryData.contentLength || 0;
  if (pageSize > 0) {
    if (pageSize < 100 * 1024) { // < 100KB
      findings.push({
        id: 'perf-page-size',
        category: 'performance',
        title: 'Small Page Size',
        description: `Page is approximately ${(pageSize / 1024).toFixed(1)}KB - Good for fast loading.`,
        severity: 'good',
      });
    } else if (pageSize > 1024 * 1024) { // > 1MB
      score -= 15;
      findings.push({
        id: 'perf-page-size',
        category: 'performance',
        title: 'Large Page Size',
        description: `Page is approximately ${(pageSize / (1024 * 1024)).toFixed(2)}MB - Consider optimization.`,
        severity: 'warning',
      });
    }
  }

  score = Math.max(0, Math.min(100, score));

  // Calculate grade
  let grade: PerformanceGrade;
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return {
    metrics: {
      responseTime,
      ttfb: primaryData.ttfb,
      totalLoadTime: responseTime,
      pageSize: pageSize || 0,
      resourceCount: 0, // Would require parsing HTML
      compressionEnabled: primaryData.compressionEnabled,
      cacheHeaders: primaryData.cacheHeaders,
      httpVersion: primaryData.httpVersion,
    },
    findings,
    score,
    grade,
  };
}

async function measureResponseTime(domain: string, useHttps: boolean, path: string = '/'): Promise<{
  responseTime: number;
  ttfb: number;
  compressionEnabled: boolean;
  cacheHeaders: boolean;
  httpVersion: string;
  contentLength: number;
  path: string;
  protocol: string;
}> {
  return new Promise((resolve, reject) => {
    const reqStartTime = Date.now();
    const httpModule = useHttps ? https : http;
    
    const options = {
      hostname: domain,
      port: useHttps ? 443 : 80,
      path,
      method: 'GET',
      timeout: 10000,
      rejectUnauthorized: false,
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'SecurityPostureAnalyzer/1.0',
      },
    };

    const req = httpModule.request(options, (res: http.IncomingMessage) => {
      const ttfb = Date.now() - reqStartTime;
      let data = '';

      res.on('data', (chunk: Buffer) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - reqStartTime;
        const headers = res.headers;
        
        resolve({
          responseTime,
          ttfb,
          compressionEnabled: !!(headers['content-encoding'] && ['gzip', 'deflate', 'br'].includes(headers['content-encoding'])),
          cacheHeaders: !!(headers['cache-control'] || headers['etag'] || headers['last-modified']),
          httpVersion: `HTTP/${res.httpVersion}`,
          contentLength: parseInt(headers['content-length'] || '0') || Buffer.byteLength(data),
          path,
          protocol: useHttps ? 'https' : 'http',
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// ==================== PENTEST (PASSIVE RECONNAISSANCE) ====================

async function runPentestScan(domain: string, headers: HeadersInfo | null, ssl: SSLInfo | null): Promise<{ result: PentestResult; score: number; grade: PentestGrade; findings: SecurityFinding[] }> {
  const findings: SecurityFinding[] = [];
  let riskScore = 0;
  
  // Technology fingerprinting from headers
  const technologies: TechnologyStack[] = [];
  
  if (headers?.server) {
    technologies.push({
      name: headers.server,
      confidence: 90,
      category: 'web-server',
    });
  }
  
  if (headers?.xPoweredBy) {
    technologies.push({
      name: headers.xPoweredBy,
      confidence: 85,
      category: 'framework',
    });
  }

  // Check for exposed information in headers
  const infoDisclosureFindings: SecurityFinding[] = [];
  
  if (headers?.via) {
    infoDisclosureFindings.push({
      id: 'pentest-via-header',
      category: 'pentest',
      title: 'Via Header Exposes Proxy Information',
      description: 'The Via header reveals proxy/CDN infrastructure details.',
      severity: 'info',
      details: headers.via,
    });
    technologies.push({
      name: headers.via.split(' ')[0],
      confidence: 70,
      category: 'cdn',
    });
  }

  // Security header analysis for pentest
  const missingSecurityHeaders: string[] = [];
  if (!headers?.strictTransportSecurity) missingSecurityHeaders.push('HSTS');
  if (!headers?.contentSecurityPolicy) missingSecurityHeaders.push('CSP');
  if (!headers?.xFrameOptions) missingSecurityHeaders.push('X-Frame-Options');
  if (!headers?.xContentTypeOptions) missingSecurityHeaders.push('X-Content-Type-Options');
  if (!headers?.referrerPolicy) missingSecurityHeaders.push('Referrer-Policy');
  if (!headers?.permissionsPolicy && !headers?.allHeaders['feature-policy']) missingSecurityHeaders.push('Permissions-Policy');

  if (missingSecurityHeaders.length > 0) {
    riskScore += missingSecurityHeaders.length * 5;
    infoDisclosureFindings.push({
      id: 'pentest-missing-headers',
      category: 'pentest',
      title: `Missing Security Headers (${missingSecurityHeaders.length})`,
      description: `The following security headers are missing: ${missingSecurityHeaders.join(', ')}`,
      severity: missingSecurityHeaders.length > 3 ? 'warning' : 'info',
      details: missingSecurityHeaders.join(', '),
    });
  }

  // SSL/TLS vulnerabilities
  const sslFindings: SecurityFinding[] = [];
  
  if (ssl) {
    if (ssl.expired) {
      riskScore += 30;
      sslFindings.push({
        id: 'pentest-expired-cert',
        category: 'vulnerability',
        title: 'CRITICAL: Expired SSL Certificate',
        description: 'The SSL certificate has expired. This is a critical security issue.',
        severity: 'critical',
        recommendation: 'Renew the SSL certificate immediately',
      });
    }
    
    if (ssl.weakCipher) {
      riskScore += 20;
      sslFindings.push({
        id: 'pentest-weak-cipher',
        category: 'vulnerability',
        title: 'Weak SSL Cipher Suites',
        description: 'The server supports weak or deprecated cipher suites.',
        severity: 'warning',
        recommendation: 'Disable weak ciphers and enable only TLS 1.2+ with strong ciphers',
      });
    }

    if (ssl.tlsVersion && ssl.tlsVersion.includes('1.0') || ssl.tlsVersion?.includes('1.1')) {
      riskScore += 15;
      sslFindings.push({
        id: 'pentest-old-tls',
        category: 'vulnerability',
        title: 'Deprecated TLS Version',
        description: `Using ${ssl.tlsVersion} which has known vulnerabilities.`,
        severity: 'warning',
        recommendation: 'Disable TLS 1.0/1.1, enable TLS 1.2+ only',
      });
    }
  } else {
    riskScore += 25;
    sslFindings.push({
      id: 'pentest-no-ssl',
      category: 'vulnerability',
      title: 'No SSL/TLS Available',
      description: 'Could not establish SSL connection. Site may not support HTTPS.',
      severity: 'critical',
      recommendation: 'Enable HTTPS with a valid SSL certificate',
    });
  }

  // Port scanning (common web ports only, passive)
  const commonPorts = [80, 443, 8080, 8443, 3000, 3001, 5000, 8000, 9000];
  const exposedPorts: PortInfo[] = [];
  
  // Only check a few ports to avoid being intrusive
  const portsToCheck = commonPorts.slice(0, 5);
  
  for (const port of portsToCheck) {
    try {
      const isOpen = await checkPort(domain, port, 3000);
      if (isOpen) {
        exposedPorts.push({
          port,
          service: getServiceName(port),
          status: 'open',
        });
        if (port !== 80 && port !== 443) {
          riskScore += 5;
        }
      }
    } catch {
      // Port closed or filtered
    }
  }

  if (exposedPorts.length > 2) {
    findings.push({
      id: 'pentest-exposed-ports',
      category: 'vulnerability',
      title: 'Multiple Open Ports Detected',
      description: `${exposedPorts.length} ports are accessible from external sources.`,
      severity: 'warning',
      details: exposedPorts.map(p => `${p.port} (${p.service})`).join(', '),
    });
  }

  // Subdomain enumeration (common subdomains only)
  const commonSubdomains = ['www', 'mail', 'ftp', 'admin', 'blog', 'shop', 'api', 'dev', 'test', 'staging'];
  const discoveredSubdomains: SubdomainInfo[] = [];
  
  // Check only a few subdomains to be non-intrusive
  const subdomainsToCheck = commonSubdomains.slice(0, 5);
  
  for (const sub of subdomainsToCheck) {
    try {
      const subdomain = `${sub}.${domain}`;
      const addresses = await dnsResolveA(subdomain);
      if (addresses && addresses.length > 0) {
        discoveredSubdomains.push({
          name: subdomain,
          resolved: true,
          ip: addresses[0],
        });
      }
    } catch {
      // Subdomain doesn't resolve
    }
  }

  if (discoveredSubdomains.length > 0) {
    findings.push({
      id: 'pentest-subdomains',
      category: 'pentest',
      title: 'Discovered Subdomains',
      description: `${discoveredSubdomains.length} subdomains were found during reconnaissance.`,
      severity: 'info',
      details: discoveredSubdomains.map(s => s.name).join(', '),
    });
  }

  // Combine all findings
  findings.push(...infoDisclosureFindings, ...sslFindings);

  // Determine grade
  let grade: PentestGrade;
  if (riskScore === 0) grade = 'SECURE';
  else if (riskScore < 30) grade = 'VULNERABLE';
  else grade = 'CRITICAL';

  return {
    result: {
      grade,
      riskScore,
      exposedPorts,
      technologies,
      subdomains: discoveredSubdomains,
      findings,
    },
    score: Math.max(0, 100 - riskScore),
    grade,
    findings,
  };
}

async function checkPort(domain: string, port: number, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(port, domain);
  });
}

function getServiceName(port: number): string {
  const services: Record<number, string> = {
    80: 'HTTP',
    443: 'HTTPS',
    8080: 'HTTP-Alt',
    8443: 'HTTPS-Alt',
    3000: 'Dev-Node',
    3001: 'Dev-Node',
    5000: 'Dev-Flask',
    8000: 'Dev-Django',
    9000: 'PHP-FPM',
  };
  return services[port] || 'Unknown';
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const rawDomain = body.domain;
    const mode: ScanMode = body.mode || 'security';

    if (!rawDomain || typeof rawDomain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required', code: 'MISSING_DOMAIN' },
        { status: 400 }
      );
    }

    const domain = validateDomain(rawDomain);

    if (!domain) {
      return NextResponse.json(
        { error: 'Invalid domain format', code: 'INVALID_DOMAIN' },
        { status: 400 }
      );
    }

    // Run base checks for all modes
    const [headers, dns, ssl] = await Promise.allSettled([
      checkHeaders(domain),
      checkDNS(domain),
      checkSSL(domain),
    ]);

    const headersResult = headers.status === 'fulfilled' ? headers.value : null;
    const dnsResult = dns.status === 'fulfilled' ? dns.value : { spf: { present: false, records: [] }, dmarc: { present: false, records: [] }, mx: { present: false, records: [] }, txt: [], ns: [], a: [] };
    const sslResult = ssl.status === 'fulfilled' ? ssl.value : null;

    if (!headersResult && !sslResult) {
      return NextResponse.json(
        { error: 'Could not connect to domain', code: 'CONNECTION_ERROR' },
        { status: 503 }
      );
    }

    let result: ScanResult;

    // Route to appropriate scan mode
    switch (mode) {
      case 'performance': {
        const perfResult = await checkPerformance(domain);
        result = {
          mode: 'performance',
          domain,
          score: perfResult.score,
          grade: perfResult.grade,
          findings: perfResult.findings.sort((a, b) => {
            const severityOrder = { critical: 0, bad: 1, warning: 2, info: 3, good: 4 };
            return severityOrder[a.severity] - severityOrder[b.severity];
          }),
          headers: headersResult || { allHeaders: {} },
          dns: dnsResult,
          ssl: sslResult,
          performance: {
            grade: perfResult.grade,
            score: perfResult.score,
            metrics: perfResult.metrics,
            findings: perfResult.findings,
          },
          scanTime: new Date().toISOString(),
          duration: Date.now() - startTime,
        };
        break;
      }

      case 'pentest': {
        const pentestResult = await runPentestScan(domain, headersResult, sslResult);
        result = {
          mode: 'pentest',
          domain,
          score: pentestResult.score,
          grade: pentestResult.grade,
          findings: pentestResult.findings.sort((a, b) => {
            const severityOrder = { critical: 0, bad: 1, warning: 2, info: 3, good: 4 };
            return severityOrder[a.severity] - severityOrder[b.severity];
          }),
          headers: headersResult || { allHeaders: {} },
          dns: dnsResult,
          ssl: sslResult,
          pentest: pentestResult.result,
          scanTime: new Date().toISOString(),
          duration: Date.now() - startTime,
        };
        break;
      }

      case 'security':
      default: {
        const { score, grade, findings } = calculateScoreAndFindings(
          headersResult || { allHeaders: {} },
          dnsResult,
          sslResult
        );
        result = {
          mode: 'security',
          domain,
          score,
          grade,
          findings: findings.sort((a, b) => {
            const severityOrder = { critical: 0, bad: 1, warning: 2, info: 3, good: 4 };
            return severityOrder[a.severity] - severityOrder[b.severity];
          }),
          headers: headersResult || { allHeaders: {} },
          dns: dnsResult,
          ssl: sslResult,
          scanTime: new Date().toISOString(),
          duration: Date.now() - startTime,
        };
        break;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
