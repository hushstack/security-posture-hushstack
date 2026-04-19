# 🔐 Security Posture Analyzer

> **Professional-grade passive reconnaissance tool for domain security analysis.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Private-red)]()

Analyze domain security with comprehensive passive reconnaissance. Check HTTP headers, SSL/TLS certificates, DNS security records (SPF, DMARC, MX), performance metrics, and vulnerability indicators — all through **100% legal, non-intrusive scanning**.

![Security Scan Demo](https://via.placeholder.com/800x400/0f172a/3b82f6?text=Security+Posture+Analyzer)

---

## ✨ Features

### 🔍 Comprehensive Security Scanning
- **HTTP Security Headers** — Analyze HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **SSL/TLS Analysis** — Certificate validity, expiry dates, cipher suites, TLS version detection
- **DNS Security Records** — SPF, DMARC, MX, TXT, NS, and A record validation
- **Information Disclosure** — Detect exposed server versions, stack traces, sensitive comments
- **XSS Vulnerability Detection** — DOM-based cross-site scripting simulation

### 📊 Multi-Mode Analysis
| Mode | Description |
|------|-------------|
| **Security** | Core HTTP headers & SSL certificate analysis |
| **Performance** | Response time, TTFB, compression, caching headers |
| **Pentest** | Port scanning, technology fingerprinting, subdomain enumeration |
| **Audit** | Deep security audit with vulnerability scoring |

### 🌍 Internationalization (i18n)
Full multi-language support powered by `next-intl`:
- 🇺🇸 English (EN)
- 🇰🇭 Khmer (KM)
- 🇮🇩 Bahasa Indonesia (ID)
- 🇲🇾 Malay (MS)
- 🇯🇵 Japanese (JA)
- 🇨🇳 Chinese (ZH)

### 📱 Modern UI/UX
- **Framer Motion** animations for smooth transitions
- **Tailwind CSS v4** for responsive, utility-first styling
- **Interactive Onboarding** guide for first-time users
- **Real-time Scan Progress** with visual feedback
- **PDF Report Generation** via html2canvas + jsPDF

### 🛡️ Security & Safety
- **Rate Limiting** — IP-based request throttling (10 req/min)
- **Input Validation** — Domain format validation with Zod schemas
- **Security Event Logging** — Pino-based audit trail
- **Security Headers** — HSTS, CSP, X-Frame-Options, Permissions-Policy
- **Email Validation** — Disposable domain blocking, regex validation

### 💬 Feedback System
- **Nodemailer Integration** — SMTP email delivery
- **Dual Email Flow** — Admin notification + user confirmation
- **Star Rating System** — 1-5 scale feedback collection
- **Anti-Spam Protection** — Suspicious pattern detection

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Runtime** | React 19 + React Server Components |
| **Language** | TypeScript 5 (strict mode) |
| **Styling** | Tailwind CSS 4 + CSS Variables |
| **Animation** | Motion (Framer Motion) |
| **State** | React Hooks + Server Actions |
| **Validation** | Zod |
| **Logging** | Pino + Pino-Pretty |
| **Email** | Nodemailer |
| **PDF** | html2canvas + jsPDF |

### Project Structure

```
security-posture-apps/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── scan/route.ts         # Main scan endpoint
│   │   ├── feedback/route.ts     # Feedback email handler
│   │   └── logs/route.ts         # Security logging
│   ├── components/               # Page-specific components
│   │   ├── SearchForm.tsx        # Domain input form
│   │   └── OnboardingGuide.tsx   # Interactive tutorial
│   ├── scan/                     # Scan results pages
│   ├── results/                  # Result display routes
│   ├── page.tsx                  # Home page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles + CSS variables
├── components/                   # Shared components
│   ├── layout/                   # Layout wrappers
│   ├── scan/                     # Scan-related UI
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesGrid.tsx
│   │   └── ScanLoading.tsx
│   └── ui/                       # Base UI primitives
├── lib/                          # Core business logic
│   ├── scanners/                 # Scanner modules
│   │   ├── index.ts               # Orchestrator (runAllScans)
│   │   ├── security.ts            # Headers, DNS, SSL checks
│   │   ├── performance.ts         # Performance metrics
│   │   ├── pentest.ts             # Port & tech scanning
│   │   ├── securityAudit.ts       # Deep vulnerability audit
│   │   └── types.ts               # Shared TypeScript types
│   ├── security/                 # Security utilities
│   │   ├── validation.ts          # Domain validation
│   │   └── logger.ts              # Security event logging
│   ├── logger.ts                 # Application logging
│   └── utils/                    # Helper functions
├── i18n/                         # Internationalization
│   ├── config.ts                 # Locale definitions
│   └── request.ts                # next-intl request handler
├── messages/                     # Translation files
│   ├── en.json, km.json, ...     # 6 language packs
├── types/                        # Global TypeScript types
├── public/                       # Static assets
│   └── fonts/                    # Custom Khmer font
└── logs/                         # Application logs
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd security-posture-apps

# Install dependencies
pnpm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your SMTP credentials

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="Security Posture Analyzer"
ADMIN_EMAIL=admin@yourdomain.com

# Security Logging
ENABLE_SECURITY_LOGGING=true
```

---

## 📈 Scanning Engine

### How It Works

```typescript
// lib/scanners/index.ts
export async function runAllScans(domain: string): Promise<ComprehensiveScanResult> {
  // 1. Base checks (parallel)
  const [headers, dns, ssl] = await Promise.allSettled([
    checkHeaders(domain),
    checkDNS(domain),
    checkSSL(domain),
  ]);

  // 2. Specialized scans (parallel)
  const [performance, pentest, audit] = await Promise.allSettled([
    checkPerformance(domain),
    runPentestScan(domain, headers, ssl),
    runSecurityAudit(`https://${domain}`),
  ]);

  // 3. Weighted scoring algorithm
  const overallScore = Math.round(
    (securityScore * 0.35) +
    (performanceScore * 0.25) +
    (pentestScore * 0.20) +
    (auditScore * 0.20)
  );

  return { grade, score: overallScore, findings, ... };
}
```

### Scoring Algorithm

| Component | Weight | Description |
|-----------|--------|-------------|
| Security Headers & SSL | 35% | Core security posture |
| Performance Metrics | 25% | Speed & optimization |
| Pentest Findings | 20% | Exposed ports & tech stack |
| Deep Audit | 20% | Vulnerability analysis |

---

## 🛠️ Development

### Code Style

- **TypeScript Strict**: Full type safety with `strict: true`
- **ESLint 9**: Modern flat config with `eslint-config-next`
- **Function Components**: React 19 with Server Components by default
- **CSS Variables**: Theme tokens for dark/light support
- **Named Exports**: Consistent component exports
- **JSDoc Comments**: Scanner modules documented

### Key Conventions

```typescript
// Type-first development
interface ScanResult {
  mode: ScanMode;
  grade: Grade;
  findings: SecurityFinding[];
}

// Parallel async execution
const results = await Promise.allSettled([
  scannerA(),
  scannerB(),
]);

// Structured logging
logger.info('Scan completed', { domain, duration, score });
```

### Available Scripts

```bash
pnpm dev      # Development server with hot reload
pnpm build    # Production build
pnpm start    # Production server
pnpm lint     # ESLint code checking
```

---

## 🔒 Security Considerations

### What's Scanned (Passive Only)
- ✅ HTTP response headers
- ✅ DNS TXT/SPF/DMARC/MX records
- ✅ SSL certificate metadata
- ✅ Publicly exposed ports (banner grabbing)
- ✅ Technology stack fingerprinting

### What's NOT Scanned (Non-intrusive)
- ❌ No SQL injection attempts
- ❌ No active XSS payloads
- ❌ No brute-force attacks
- ❌ No file/directory enumeration beyond common paths
- ❌ No authentication bypass attempts

### Compliance
This tool performs **passive reconnaissance only** — all data is collected from publicly available sources without sending malicious payloads or attempting unauthorized access.

---

## 📚 Documentation

- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) — Security audit procedures & OWASP Top 10 status
- [SECURITY_FIXES.md](./SECURITY_FIXES.md) — Implemented security hardening measures
- [AI_SETUP.md](./AI_SETUP.md) — AI provider configuration (if applicable)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Private — Unauthorized use, reproduction, or distribution is prohibited.

---

<p align="center">
  Built with <strong>Next.js</strong>, <strong>React</strong>, and <strong>TypeScript</strong>
</p>

