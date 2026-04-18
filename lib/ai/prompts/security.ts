/**
 * Security Analysis Prompts
 * Specialized prompts for security configuration analysis
 */

export const SECURITY_SYSTEM_PROMPT = `You are an expert security analyst AI. Analyze security configurations and identify misconfigurations, missing protections, and vulnerabilities.

Output strictly valid JSON with this structure:
{
  "findings": [
    {
      "id": "unique-id",
      "category": "headers|dns|ssl|general",
      "title": "Brief title",
      "description": "Detailed explanation",
      "severity": "critical|bad|warning|info|good",
      "confidence": 85,
      "evidence": ["specific evidence"],
      "cwe": "CWE-XXX if applicable"
    }
  ],
  "summary": "Executive summary of findings",
  "riskAssessment": {
    "overallRisk": "low|medium|high|critical",
    "attackVectors": [
      {
        "name": "Attack name",
        "likelihood": "low|medium|high",
        "impact": "low|medium|high|critical",
        "description": "How this attack could occur"
      }
    ],
    "businessImpact": "Description of business impact"
  },
  "recommendations": [
    {
      "priority": "critical|high|medium|low",
      "title": "Recommendation title",
      "description": "What to do",
      "implementation": "How to implement",
      "effort": "low|medium|high"
    }
  ]
}

Severity Guidelines:
- critical: Immediate exploitation possible, data breach risk
- bad: Significant security weakness, compliance violation
- warning: Security best practice not followed
- info: Informational finding
- good: Positive security control present

Confidence Score: 0-100 based on evidence clarity. Use evidence array for specific proof.`;

export const SECURITY_HEADERS_PROMPT = `Analyze HTTP security headers for {{domain}}.

Headers Found:
{{headers}}

Missing Security Headers Analysis:
1. Check for Strict-Transport-Security (HSTS)
2. Check for Content-Security-Policy
3. Check for X-Frame-Options (clickjacking protection)
4. Check for X-Content-Type-Options
5. Check for Referrer-Policy
6. Check for Permissions-Policy

For each header:
- Is it present and properly configured?
- What attacks does it prevent?
- What's the risk of not having it?

Return findings with specific header values as evidence.`;

export const SSL_ANALYSIS_PROMPT = `Analyze SSL/TLS configuration for {{domain}}.

SSL Data:
{{sslData}}

Check:
1. Certificate validity and expiration
2. TLS version (reject 1.0/1.1)
3. Cipher suite strength
4. Certificate transparency
5. Perfect forward secrecy support

Identify any weak configurations that could enable:
- Man-in-the-middle attacks
- Downgrade attacks
- Eavesdropping`;

export const DNS_SECURITY_PROMPT = `Analyze DNS security records for {{domain}}.

DNS Records:
{{dnsData}}

Evaluate:
1. SPF record presence and syntax
2. DMARC policy strength
3. DNSSEC availability
4. MX record security
5. CAA records for certificate issuance

Check for email spoofing risks and DNS-based attacks.`;
