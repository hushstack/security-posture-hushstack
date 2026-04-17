/**
 * Performance Scanner Module
 * Handles response time, compression, caching, and HTTP version checks
 */

import https from 'https';
import http from 'http';
import type { IncomingMessage } from 'http';
import type {
  SecurityFinding,
  PerformanceResult,
  PerformanceGrade,
} from './types';

interface ResponseMetrics {
  responseTime: number;
  ttfb: number;
  compressionEnabled: boolean;
  cacheHeaders: boolean;
  httpVersion: string;
  contentLength: number;
  path: string;
  protocol: string;
}

async function measureResponseTime(
  domain: string,
  useHttps: boolean,
  path: string = '/'
): Promise<ResponseMetrics> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
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

    const req = httpModule.request(options, (res: IncomingMessage) => {
      const ttfb = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk: Buffer) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        const headers = res.headers;

        resolve({
          responseTime,
          ttfb,
          compressionEnabled: !!(headers['content-encoding'] && 
            ['gzip', 'deflate', 'br'].includes(headers['content-encoding'])),
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

function calculateResponseTimeFinding(
  metrics: ResponseMetrics,
  domain: string
): { finding: SecurityFinding; scoreDeduction: number } {
  const { responseTime, ttfb, protocol, path } = metrics;
  const route = `${protocol}://${domain}${path}`;

  if (responseTime < 200) {
    return {
      finding: {
        id: 'perf-response-time',
        category: 'performance',
        title: 'Excellent Response Time',
        description: `Server responded in ${responseTime}ms - Very fast!`,
        severity: 'good',
        details: `Route: ${route} | TTFB: ${ttfb}ms`,
      },
      scoreDeduction: 0,
    };
  } else if (responseTime < 500) {
    return {
      finding: {
        id: 'perf-response-time',
        category: 'performance',
        title: 'Good Response Time',
        description: `Server responded in ${responseTime}ms - Acceptable performance.`,
        severity: 'good',
        details: `Route: ${route} | TTFB: ${ttfb}ms`,
      },
      scoreDeduction: 10,
    };
  } else if (responseTime < 1000) {
    return {
      finding: {
        id: 'perf-response-time',
        category: 'performance',
        title: 'Slow Response Time',
        description: `Server responded in ${responseTime}ms - Consider optimization.`,
        severity: 'warning',
        details: `Route: ${route} | TTFB: ${ttfb}ms`,
      },
      scoreDeduction: 25,
    };
  } else {
    return {
      finding: {
        id: 'perf-response-time',
        category: 'performance',
        title: 'Very Slow Response Time',
        description: `Server responded in ${responseTime}ms - Performance needs immediate attention.`,
        severity: 'bad',
        details: `Route: ${route} | TTFB: ${ttfb}ms`,
      },
      scoreDeduction: 40,
    };
  }
}

function calculatePageSizeFinding(pageSize: number): SecurityFinding | null {
  if (pageSize === 0) return null;

  if (pageSize < 100 * 1024) {
    return {
      id: 'perf-page-size',
      category: 'performance',
      title: 'Small Page Size',
      description: `Page is approximately ${(pageSize / 1024).toFixed(1)}KB - Good for fast loading.`,
      severity: 'good',
    };
  } else if (pageSize > 1024 * 1024) {
    return {
      id: 'perf-page-size',
      category: 'performance',
      title: 'Large Page Size',
      description: `Page is approximately ${(pageSize / (1024 * 1024)).toFixed(2)}MB - Consider optimization.`,
      severity: 'warning',
    };
  }
  return null;
}

export async function checkPerformance(domain: string): Promise<PerformanceResult> {
  const findings: SecurityFinding[] = [];

  // Check both HTTP and HTTPS
  const [httpResult, httpsResult] = await Promise.allSettled([
    measureResponseTime(domain, false),
    measureResponseTime(domain, true),
  ]);

  const httpsData = httpsResult.status === 'fulfilled' ? httpsResult.value : null;
  const httpData = httpResult.status === 'fulfilled' ? httpResult.value : null;
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
      grade: 'F',
      score: 0,
      metrics: {
        responseTime: 0,
        ttfb: 0,
        totalLoadTime: 0,
        pageSize: 0,
        resourceCount: 0,
        compressionEnabled: false,
        cacheHeaders: false,
        httpVersion: 'unknown',
        path: '/',
        protocol: 'https',
      },
      findings,
    };
  }

  let score = 100;

  // Response time
  const { finding: responseTimeFinding, scoreDeduction } = calculateResponseTimeFinding(primaryData, domain);
  findings.push(responseTimeFinding);
  score -= scoreDeduction;

  // Compression
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

  // Caching
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

  // HTTP version
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

  // HTTPS availability info
  if (httpData && httpsData) {
    findings.push({
      id: 'perf-https-available',
      category: 'performance',
      title: 'HTTPS Available',
      description: 'Both HTTP and HTTPS endpoints are accessible.',
      severity: 'info',
    });
  }

  // Page size
  const pageSizeFinding = calculatePageSizeFinding(primaryData.contentLength);
  if (pageSizeFinding) {
    findings.push(pageSizeFinding);
    if (pageSizeFinding.severity === 'warning') {
      score -= 15;
    }
  }

  score = Math.max(0, Math.min(100, score));

  let grade: PerformanceGrade;
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return {
    grade,
    score,
    metrics: {
      responseTime: primaryData.responseTime,
      ttfb: primaryData.ttfb,
      totalLoadTime: primaryData.responseTime,
      pageSize: primaryData.contentLength || 0,
      resourceCount: 0,
      compressionEnabled: primaryData.compressionEnabled,
      cacheHeaders: primaryData.cacheHeaders,
      httpVersion: primaryData.httpVersion,
      path: primaryData.path,
      protocol: primaryData.protocol,
    },
    findings,
  };
}
