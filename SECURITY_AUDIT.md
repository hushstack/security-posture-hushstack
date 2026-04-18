# Security Audit Guide

## Dependency Audit Process

### 1. Run Regular Audits

```bash
# Check for vulnerabilities in dependencies
pnpm audit

# Check for outdated packages
pnpm outdated

# Check for license compliance
pnpm licenses list
```

### 2. Automate with GitHub Actions

Create `.github/workflows/security-audit.yml`:

```yaml
name: Security Audit

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm audit --audit-level moderate
      - run: pnpm outdated
```

### 3. Current Dependencies Review

#### High-Risk Dependencies
| Package | Version | Risk | Mitigation |
|---------|---------|------|------------|
| jspdf | 4.2.1 | Medium | Keep updated, PDF generation |
| html2canvas | 1.4.1 | Medium | Keep updated, canvas rendering |
| next | 16.2.4 | Low | Framework, auto-updates |
| react | 18.2.0 | Low | Core dependency |

#### AI Provider Security
- **Gemini API**: API key stored in env vars
- **Rate limiting**: Exponential backoff with retry
- **Data sanitization**: Prevents prompt injection

### 4. Monitoring Checklist

- [ ] Run `pnpm audit` weekly
- [ ] Review GitHub Dependabot alerts
- [ ] Check for package updates monthly
- [ ] Review security event logs
- [ ] Update AI model versions quarterly

### 5. Incident Response

If vulnerability found:
1. Assess severity (CVSS score)
2. Check if exploitable in our context
3. Update dependency or apply patch
4. Test thoroughly
5. Deploy fix
6. Document in incident log

## Security Event Logging

Logs are output to console with `[SECURITY]` prefix. Enable detailed logging:

```bash
ENABLE_SECURITY_LOGGING=true pnpm dev
```

### Logged Events
- SCAN_STARTED / SCAN_COMPLETED / SCAN_FAILED
- RATE_LIMIT_HIT
- INVALID_DOMAIN
- AI_ANALYSIS_STARTED / AI_ANALYSIS_COMPLETED / AI_ANALYSIS_FAILED
- SENSITIVE_DATA_REDACTED
- PROMPT_INJECTION_ATTEMPT (critical)

## OWASP Top 10 Status

| Category | Status | Notes |
|----------|--------|-------|
| A01: Access Control | ✅ Good | Rate limiting, no auth needed |
| A02: Crypto | ✅ Good | API keys in env, HTTPS |
| A03: Injection | ✅ Good | Input validation, data sanitization |
| A04: Insecure Design | ✅ Good | Graceful degradation |
| A05: Misconfig | ✅ Good | Secure defaults |
| A06: Vulnerable Components | ⚠️ Review | Run `pnpm audit` regularly |
| A07: Auth Failures | N/A | No auth required |
| A08: Integrity | ✅ Good | No deserialization |
| A09: Logging | ✅ Good | Security event logging |
| A10: SSRF | ✅ Good | Domain validation |
