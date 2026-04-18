# Security Findings - Fix Guide

This document explains how to address security findings reported by the scanner that are infrastructure-level issues, not application-level code issues.

---

## 1. CSP: unsafe-inline, unsafe-eval (Insecure CSP Directives)

### Current Status
The Content Security Policy contains `unsafe-inline` and `unsafe-eval` directives which allow XSS attacks.

### Why It's in Code
These directives are **required** by Next.js for runtime functionality:
- `unsafe-inline` - Needed for styled-jsx CSS-in-JS
- `unsafe-eval` - Needed for dynamic imports and runtime code evaluation

### How to Fix (Infrastructure Change Required)

**Option A: Self-Host with Strict CSP**
```bash
# Deploy to AWS/GCP/Azure instead of Vercel
# Use nginx with strict CSP headers:

add_header Content-Security-Policy "default-src 'self'; \
  script-src 'self'; \
  style-src 'self'; \
  img-src 'self' data: https:; \
  font-src 'self'; \
  connect-src 'self'; \
  frame-ancestors 'none'; \
  base-uri 'self'; \
  form-action 'self'; \
  upgrade-insecure-requests;" always;
```

**Option B: Use Next.js with Nonce-Based CSP**
```typescript
// proxy.ts
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export function proxy(request) {
  const nonce = randomBytes(16).toString('base64')
  
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self';
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim()
  
  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('x-nonce', nonce)
  
  return response
}
```

**Note:** Nonce-based CSP requires significant refactoring of the Next.js app to inject nonces into all inline scripts/styles.

---

## 2. Server Header Exposed (Vercel)

### Current Status
The `Server: Vercel` header reveals hosting infrastructure information to attackers.

### Why It's in Code
Setting `Server: ''` in next.config.ts doesn't remove it because **Vercel adds this at their edge layer** after our response leaves the application.

### How to Fix (Infrastructure Change Required)

**Option A: Use Custom Domain + Cloudflare**
```bash
# 1. Add Cloudflare in front of Vercel
# 2. In Cloudflare, add Transform Rule:
#    Remove response header: Server
```

**Option B: Self-Host (AWS/GCP/Azure)**
```nginx
# nginx.conf
server_tokens off;  # Removes Server header completely
more_clear_headers Server;  # If using headers-more-nginx-module
```

**Option C: Use Netlify Instead**
Netlify allows custom headers configuration via `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Server = ""
```

---

## 3. HTTP/1.1 Legacy Protocol

### Current Status
Server uses HTTP/1.1 instead of HTTP/2 or HTTP/3.

### Why It's in Code
The protocol version is controlled by **Vercel's infrastructure**, not application code.

### How to Fix (Infrastructure Change Required)

**Option A: Cloudflare CDN**
```bash
# 1. Route traffic through Cloudflare
# 2. Enable HTTP/2 and HTTP/3 in Cloudflare dashboard:
#    Speed → Optimization → Protocol Optimization
```

**Option B: Self-Host with HTTP/2**
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    # Enable HTTP/3 (QUIC)
    listen 443 quic reuseport;
    listen [::]:443 quic reuseport;
    add_header Alt-Svc 'h3=":443"; ma=86400';
}
```

**Option C: AWS Application Load Balancer**
```bash
# ALB automatically provides HTTP/2 to clients
# while connecting to backend via HTTP/1.1
```

---

## Summary of Required Changes

| Finding | Current Platform | Fix Platform | Effort |
|---------|-----------------|--------------|--------|
| CSP unsafe-* | Vercel | Self-hosted or nonce-based CSP | High |
| Server header | Vercel | Cloudflare + Vercel or Netlify | Medium |
| HTTP/1.1 | Vercel | Cloudflare or ALB | Low |

## Recommended Approach

For a production security posture:

1. **Add Cloudflare CDN** (fixes HTTP/1.1 + can strip Server header)
2. **Accept CSP trade-off** or invest in nonce-based implementation
3. **Consider migration** to AWS/GCP for full control if security is critical

## Acceptable Risk Decision

These findings are **acceptable** for most applications because:
- Next.js requires `unsafe-*` for core functionality
- Vercel's edge layer is trusted infrastructure
- HTTP/1.1 vs HTTP/2 is a performance issue, not security

Only address if your threat model requires defense against sophisticated attackers.
