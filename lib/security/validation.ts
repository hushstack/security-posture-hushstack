/**
 * Input Validation & Security Utilities
 * Domain validation, sanitization, and security helpers
 */

// Domain validation regex - strict pattern to prevent injection
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])$/;

// Blocklist for dangerous inputs
const BLOCKED_PATTERNS = [
  /[<>]/,                    // HTML/script tags
  /[;|&$`\\]/,              // Command injection chars
  /\.\./,                   // Path traversal
  /^\//,                    // Absolute paths
  /\s/,                      // Whitespace (to prevent injection combos)
];

// Private IP ranges - prevent scanning internal networks
const PRIVATE_IP_PATTERNS = [
  /^127\./,                  // Loopback
  /^10\./,                   // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B
  /^192\.168\./,             // Private Class C
  /^169\.254\./,             // Link-local
  /^0\./,                    // Invalid
  /^255\./,                  // Broadcast
];

/**
 * Validates and sanitizes domain input
 * Returns cleaned domain or null if invalid
 */
export function validateDomain(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim().toLowerCase();

  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return null;
    }
  }

  // Remove protocol if present
  let cleaned = trimmed;
  if (cleaned.startsWith('http://')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('https://')) {
    cleaned = cleaned.slice(8);
  }

  // Remove path, query params, and port
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0].split(':')[0];

  // Must not be empty
  if (!cleaned || cleaned.length < 1 || cleaned.length > 253) {
    return null;
  }

  // Check for private IPs
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(cleaned)) {
      return null;
    }
  }

  // Validate domain format
  if (!DOMAIN_REGEX.test(cleaned)) {
    return null;
  }

  // Each label must be <= 63 chars
  const labels = cleaned.split('.');
  for (const label of labels) {
    if (label.length > 63) {
      return null;
    }
  }

  return cleaned;
}

/**
 * Validates scan mode
 */
export function validateMode(mode: string): 'security' | 'performance' | 'pentest' | null {
  const validModes = ['security', 'performance', 'pentest'] as const;
  return validModes.includes(mode as typeof validModes[number]) ? mode as typeof validModes[number] : null;
}

/**
 * Rate limiting store (in-memory, per-instance)
 * For production, use Redis or similar
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple rate limiting check
 * Returns true if request should be allowed
 */
export function checkRateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Cleans up expired rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
