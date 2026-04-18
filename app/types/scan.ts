export type ScanMode = 'security' | 'performance' | 'pentest' | 'audit';
export type SecurityGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type PerformanceGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type PentestGrade = 'SECURE' | 'VULNERABLE' | 'CRITICAL';

export type FindingSeverity = 'good' | 'warning' | 'bad' | 'critical' | 'info';

export interface SecurityFinding {
  id: string;
  category: 'headers' | 'dns' | 'ssl' | 'general' | 'performance' | 'pentest' | 'vulnerability';
  title: string;
  description: string;
  severity: FindingSeverity;
  details?: string;
  recommendation?: string;
}

// Performance specific types
export interface PerformanceMetrics {
  responseTime: number;
  ttfb: number; // Time to first byte
  totalLoadTime: number;
  pageSize: number;
  resourceCount: number;
  compressionEnabled: boolean;
  cacheHeaders: boolean;
  httpVersion: string;
  serverLocation?: string;
  path: string;
  protocol: string;
}

export interface PerformanceResult {
  grade: PerformanceGrade;
  score: number;
  metrics: PerformanceMetrics;
  findings: SecurityFinding[];
}

// Pentest specific types (all passive reconnaissance only)
export interface PortInfo {
  port: number;
  service: string;
  status: 'open' | 'closed' | 'filtered';
  banner?: string;
}

export interface TechnologyStack {
  name: string;
  version?: string;
  confidence: number;
  category: 'web-server' | 'framework' | 'language' | 'database' | 'cdn' | 'analytics';
}

export interface SubdomainInfo {
  name: string;
  resolved: boolean;
  ip?: string;
}

export interface PentestResult {
  grade: PentestGrade;
  riskScore: number;
  exposedPorts: PortInfo[];
  technologies: TechnologyStack[];
  subdomains: SubdomainInfo[];
  findings: SecurityFinding[];
}

export interface HeaderCheck {
  name: string;
  present: boolean;
  value?: string;
}

export interface SSLInfo {
  valid: boolean;
  expired: boolean;
  daysUntilExpiry: number;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  cipherSuites?: string[];
  tlsVersion?: string;
  weakCipher?: boolean;
}

export interface DNSRecords {
  spf: {
    present: boolean;
    records: string[];
  };
  dmarc: {
    present: boolean;
    records: string[];
    policy?: string;
  };
  mx: {
    present: boolean;
    records: string[];
  };
  txt: string[];
  ns: string[];
  a: string[];
}

export interface HeadersInfo {
  strictTransportSecurity?: string;
  contentSecurityPolicy?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  xXssProtection?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  cacheControl?: string;
  etag?: string;
  lastModified?: string;
  server?: string;
  xPoweredBy?: string;
  via?: string;
  allHeaders: Record<string, string>;
}

export interface ScanResult {
  mode: ScanMode;
  domain: string;
  score: number;
  grade: SecurityGrade | PerformanceGrade | PentestGrade;
  findings: SecurityFinding[];
  headers: HeadersInfo;
  dns: DNSRecords;
  ssl: SSLInfo | null;
  performance?: PerformanceResult;
  pentest?: PentestResult;
  scanTime: string;
  duration: number;
}

export interface ComprehensiveScanResult extends ScanResult {
  securityScore: number;
  performanceScore: number;
  pentestScore: number;
  auditScore: number;
  auditReport?: {
    targetUrl: string;
    scanTimestamp: string;
    riskScore: number;
    riskLevel: string;
    findings: Array<{
      id: string;
      category: string;
      severity: string;
      title: string;
      description: string;
      cvss: number;
      cwe: string;
      evidence: string;
      recommendation: string;
    }>;
    sslAnalysis?: {
      valid: boolean;
      expired: boolean;
      daysUntilExpiry: number;
      tlsVersion: string;
      weakProtocols: string[];
      weakCiphers: string[];
    };
    headerAnalysis?: {
      missingHeaders: string[];
      weakHeaders: string[];
      securityScore: number;
    };
    infoDisclosure?: {
      htmlComments: string[];
      exposedEmails: string[];
      exposedIps: string[];
      exposedPaths: string[];
      versionNumbers: string[];
    };
    xssTests?: {
      totalTests: number;
      reflectedCount: number;
      sanitizedCount: number;
    };
  };
}

export interface ScanRequest {
  domain: string;
}

export interface ScanError {
  error: string;
  code: string;
}
