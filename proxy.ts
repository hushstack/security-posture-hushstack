import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

export function proxy(_request: NextRequest) {
  const nonce = generateNonce();

  const isDev = process.env.NODE_ENV === 'development';

  // Build CSP with nonce
  // style-src includes 'unsafe-inline' for Next.js styled-jsx CSS-in-JS
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  const response = NextResponse.next();

  // Set CSP header
  response.headers.set('Content-Security-Policy', csp);

  // Store nonce in header for layout to access
  response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  matcher: [
    '/',
    '/results',
    '/scan/loading',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
