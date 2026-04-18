import { type NextRequest, NextResponse } from 'next/server';
import { runAllScans } from '@/lib/scanners';
import { validateDomain, checkRateLimit } from '@/lib/security/validation';
import { securityLogger } from '@/lib/security/logger';
import { logger, logRequest, logError, logInfo, logWarn } from '@/lib/logger';

/**
 * POST /api/scan
 * Runs comprehensive security, performance, pentest, and audit scans
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  let rawDomain: string | undefined;

  try {
    logRequest('POST', '/api/scan', ip);
    
    // Rate limiting by IP
    if (!checkRateLimit(ip, 10, 60000)) {
      logWarn('Rate limit exceeded', { ip, domain: rawDomain });
      securityLogger.rateLimitHit(ip, rawDomain);
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const { domain: rawDomainInput } = body;
    rawDomain = rawDomainInput;

    if (!rawDomain || typeof rawDomain !== 'string') {
      logInfo('Missing domain in scan request', { ip });
      return NextResponse.json(
        { error: 'Domain is required', code: 'MISSING_DOMAIN' },
        { status: 400 }
      );
    }

    // Validate domain
    const domain = validateDomain(rawDomain);
    if (!domain) {
      logInfo('Invalid domain format', { ip, rawDomain });
      securityLogger.invalidDomain(ip, rawDomain, 'Validation failed');
      return NextResponse.json(
        { error: 'Invalid domain format', code: 'INVALID_DOMAIN' },
        { status: 400 }
      );
    }

    // Log scan start
    logInfo('Scan started', { ip, domain, type: 'comprehensive' });
    securityLogger.scanStarted(ip, domain, 'comprehensive');

    // Run comprehensive scan (all modes)
    const result = await runAllScans(domain);

    // Log scan completion
    logInfo('Scan completed', { ip, domain, duration: result.duration, score: result.score });
    securityLogger.scanCompleted(ip, domain, result.duration || 0, result.score);

    return NextResponse.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(error instanceof Error ? error : new Error(errorMessage), { route: '/api/scan', ip, domain: rawDomain });

    securityLogger.scanFailed(ip, rawDomain || 'unknown', errorMessage);

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
