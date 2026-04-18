import { type NextRequest, NextResponse } from 'next/server';
import { runScan } from '@/lib/scanners';
import { validateDomain, checkRateLimit } from '@/lib/security/validation';
import { securityLogger } from '@/lib/security/logger';
import type { ScanMode } from '@/lib/scanners/types';

/**
 * POST /api/scan
 * Main scan endpoint with modular scanner architecture
 */
export async function POST(request: NextRequest) {
  // Get IP first for logging
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  let rawDomain: string | undefined;
  let mode: ScanMode;

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
    const { domain: rawDomainInput, mode: rawMode = 'security', enableAI = false } = body;
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

    // Validate mode
    const validModes: ScanMode[] = ['security', 'performance', 'pentest'];
    mode = validModes.includes(rawMode) ? rawMode : 'security';

    // Log scan start
    securityLogger.scanStarted(ip, domain, mode);

    // Run scan using modular scanner
    const result = await runScan(domain, {
      mode,
      ai: enableAI ? {
        provider: 'gemini',
        apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
        model: process.env.AI_MODEL || 'gemini-flash-latest',
      } : undefined,
    });

    // Log scan completion
    securityLogger.scanCompleted(ip, domain, result.duration || 0, result.score);

    return NextResponse.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Scan error:', error);
    
    // Log scan failure
    securityLogger.scanFailed(ip, rawDomain || 'unknown', errorMessage);
    
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
