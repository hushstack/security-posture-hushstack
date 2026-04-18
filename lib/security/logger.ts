/**
 * Security Event Logger
 * Logs security-relevant events for monitoring and auditing
 */

export enum SecurityEventType {
  SCAN_STARTED = 'SCAN_STARTED',
  SCAN_COMPLETED = 'SCAN_COMPLETED',
  SCAN_FAILED = 'SCAN_FAILED',
  RATE_LIMIT_HIT = 'RATE_LIMIT_HIT',
  INVALID_DOMAIN = 'INVALID_DOMAIN',
  AI_ANALYSIS_STARTED = 'AI_ANALYSIS_STARTED',
  AI_ANALYSIS_COMPLETED = 'AI_ANALYSIS_COMPLETED',
  AI_ANALYSIS_FAILED = 'AI_ANALYSIS_FAILED',
  SENSITIVE_DATA_REDACTED = 'SENSITIVE_DATA_REDACTED',
  PROMPT_INJECTION_ATTEMPT = 'PROMPT_INJECTION_ATTEMPT',
}

interface SecurityEvent {
  timestamp: string;
  type: SecurityEventType;
  ip?: string;
  domain?: string;
  details?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

class SecurityLogger {
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.ENABLE_SECURITY_LOGGING === 'true';
  }

  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Always log to console for security events
    const logMethod = this.getLogMethod(event.severity);
    logMethod(`[SECURITY] ${event.type}`, fullEvent);

    // In production, you might want to send to a SIEM or security monitoring service
    if (this.enabled && event.severity === 'critical') {
      // TODO: Send to external security monitoring service
      // Example: sendToSIEM(fullEvent);
    }
  }

  private getLogMethod(severity: string) {
    switch (severity) {
      case 'error':
      case 'critical':
        return console.error;
      case 'warning':
        return console.warn;
      default:
        return console.log;
    }
  }

  // Convenience methods
  scanStarted(ip: string, domain: string, mode: string): void {
    this.log({
      type: SecurityEventType.SCAN_STARTED,
      ip,
      domain,
      details: { mode },
      severity: 'info',
    });
  }

  scanCompleted(ip: string, domain: string, duration: number, score: number): void {
    this.log({
      type: SecurityEventType.SCAN_COMPLETED,
      ip,
      domain,
      details: { duration, score },
      severity: 'info',
    });
  }

  scanFailed(ip: string, domain: string, error: string): void {
    this.log({
      type: SecurityEventType.SCAN_FAILED,
      ip,
      domain,
      details: { error },
      severity: 'error',
    });
  }

  rateLimitHit(ip: string, domain?: string): void {
    this.log({
      type: SecurityEventType.RATE_LIMIT_HIT,
      ip,
      domain,
      severity: 'warning',
    });
  }

  invalidDomain(ip: string, domain: string, reason: string): void {
    this.log({
      type: SecurityEventType.INVALID_DOMAIN,
      ip,
      domain,
      details: { reason },
      severity: 'warning',
    });
  }

  aiAnalysisStarted(domain: string, model: string): void {
    this.log({
      type: SecurityEventType.AI_ANALYSIS_STARTED,
      domain,
      details: { model },
      severity: 'info',
    });
  }

  aiAnalysisCompleted(domain: string, model: string, duration: number): void {
    this.log({
      type: SecurityEventType.AI_ANALYSIS_COMPLETED,
      domain,
      details: { model, duration },
      severity: 'info',
    });
  }

  aiAnalysisFailed(domain: string, model: string, error: string): void {
    this.log({
      type: SecurityEventType.AI_ANALYSIS_FAILED,
      domain,
      details: { model, error },
      severity: 'error',
    });
  }

  sensitiveDataRedacted(domain: string, fields: string[]): void {
    this.log({
      type: SecurityEventType.SENSITIVE_DATA_REDACTED,
      domain,
      details: { fieldsRedacted: fields },
      severity: 'info',
    });
  }

  promptInjectionAttempt(ip: string, domain: string, pattern: string): void {
    this.log({
      type: SecurityEventType.PROMPT_INJECTION_ATTEMPT,
      ip,
      domain,
      details: { pattern },
      severity: 'critical',
    });
  }
}

export const securityLogger = new SecurityLogger();
