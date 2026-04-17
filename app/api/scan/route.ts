import { type NextRequest, NextResponse } from 'next/server';
import { runScan } from '@/lib/scanners';
import { validateDomain, checkRateLimit } from '@/lib/security/validation';
import type { ScanMode } from '@/lib/scanners/types';

/**
 * POST /api/scan
 * Main scan endpoint with modular scanner architecture
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip, 10, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const { domain: rawDomain, mode: rawMode = 'security' } = body;

    if (!rawDomain || typeof rawDomain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required', code: 'MISSING_DOMAIN' },
        { status: 400 }
      );
    }

    // Validate domain
    const domain = validateDomain(rawDomain);
    if (!domain) {
      return NextResponse.json(
        { error: 'Invalid domain format', code: 'INVALID_DOMAIN' },
        { status: 400 }
      );
    }

    // Validate mode
    const validModes: ScanMode[] = ['security', 'performance', 'pentest'];
    const mode: ScanMode = validModes.includes(rawMode) ? rawMode : 'security';

    // Run scan using modular scanner
    const result = await runScan(domain, { mode });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
