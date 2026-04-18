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
  SENSITIVE_DATA_REDACTED = 'SENSITIVE_DATA_REDACTED',
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

  sensitiveDataRedacted(domain: string, fields: string[]): void {
    this.log({
      type: SecurityEventType.SENSITIVE_DATA_REDACTED,
      domain,
      details: { fieldsRedacted: fields },
      severity: 'info',
    });
  }

}

export const securityLogger = new SecurityLogger();
