import { type NextRequest, NextResponse } from 'next/server';
import { runAllScans } from '@/lib/scanners';
import { validateDomain, checkRateLimit } from '@/lib/security/validation';
import { securityLogger } from '@/lib/security/logger';

/**
 * POST /api/scan
 * Runs comprehensive security, performance, pentest, and audit scans
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  let rawDomain: string | undefined;

  try {
    // Rate limiting by IP
    if (!checkRateLimit(ip, 10, 60000)) {
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
      return NextResponse.json(
        { error: 'Domain is required', code: 'MISSING_DOMAIN' },
        { status: 400 }
      );
    }

    // Validate domain
    const domain = validateDomain(rawDomain);
    if (!domain) {
      securityLogger.invalidDomain(ip, rawDomain, 'Validation failed');
      return NextResponse.json(
        { error: 'Invalid domain format', code: 'INVALID_DOMAIN' },
        { status: 400 }
      );
    }

    // Log scan start
    securityLogger.scanStarted(ip, domain, 'comprehensive');

    // Run comprehensive scan (all modes)
    const result = await runAllScans(domain);

    // Log scan completion
    securityLogger.scanCompleted(ip, domain, result.duration || 0, result.score);

    return NextResponse.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Scan error:', error);

    securityLogger.scanFailed(ip, rawDomain || 'unknown', errorMessage);

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
