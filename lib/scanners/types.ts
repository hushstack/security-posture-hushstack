/**
 * Core types for all scanners
 * Centralized type definitions for maintainability
 */

export type ScanMode = 'security' | 'performance' | 'pentest' | 'audit';

export type SecurityGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type PerformanceGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type PentestGrade = 'SECURE' | 'VULNERABLE' | 'CRITICAL';
export type Grade = SecurityGrade | PerformanceGrade | PentestGrade;

export type FindingSeverity = 'good' | 'warning' | 'bad' | 'critical' | 'info';
export type FindingCategory = 'headers' | 'dns' | 'ssl' | 'general' | 'performance' | 'pentest' | 'vulnerability';

export interface SecurityFinding {
  id: string;
  category: FindingCategory;
  title: string;
  description: string;
  severity: FindingSeverity;
  details?: string;
  recommendation?: string;
}

// SSL/TLS Types
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

// DNS Types
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

// HTTP Headers Types
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

// Performance Types
export interface PerformanceMetrics {
  responseTime: number;
  ttfb: number;
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

// Pentest Types
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
  category: 'web-server' | 'framework' | 'language' | 'database' | 'cdn' | 'analytics' | 'cms' | 'infrastructure';
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

// Main Scan Result
export interface ScanResult {
  mode: ScanMode;
  domain: string;
  score: number;
  grade: Grade;
  findings: SecurityFinding[];
  headers: HeadersInfo;
  dns: DNSRecords;
  ssl: SSLInfo | null;
  performance?: PerformanceResult;
  pentest?: PentestResult;
  scanTime: string;
  duration: number;
}

export interface ScanRequest {
  domain: string;
  mode: ScanMode;
}

export interface ScanError {
  error: string;
  code: string;
}

// Scanner Function Types
export type ScannerFunction<T> = (domain: string) => Promise<T>;

export interface BaseScanResult {
  findings: SecurityFinding[];
  score: number;
}
