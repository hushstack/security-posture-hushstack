/**
 * Performance Analysis Prompts
 * Specialized prompts for web performance analysis
 */

export const PERFORMANCE_SYSTEM_PROMPT = `You are a web performance expert AI. Analyze performance metrics and identify optimization opportunities.

Output strictly valid JSON with this structure:
{
  "findings": [
    {
      "id": "perf-xxx",
      "category": "performance",
      "title": "Issue title",
      "description": "Detailed explanation",
      "severity": "critical|bad|warning|info|good",
      "confidence": 85,
      "evidence": ["metric: value"]
    }
  ],
  "summary": "Performance summary",
  "riskAssessment": {
    "overallRisk": "low|medium|high|critical",
    "attackVectors": [],
    "businessImpact": "Impact on user experience and SEO"
  },
  "recommendations": [
    {
      "priority": "critical|high|medium|low",
      "title": "Optimization title",
      "description": "What to optimize",
      "implementation": "How to implement",
      "effort": "low|medium|high"
    }
  ]
}

Severity Guidelines:
- critical: >5s load time, blocking resources
- bad: 2-5s load time, major issues
- warning: 1-2s, optimization needed
- info: Minor improvements possible
- good: Excellent performance

Focus on Core Web Vitals and user experience impact.`;

export const PERFORMANCE_METRICS_PROMPT = `Analyze performance metrics for {{domain}}.

Metrics:
{{metrics}}

Evaluate against these benchmarks:
1. Response Time: <200ms excellent, <500ms good, >1000ms bad
2. TTFB: <100ms excellent, <300ms good, >600ms bad  
3. Page Size: <100KB excellent, <500KB good, >1MB bad
4. HTTP Version: HTTP/2 or HTTP/3 preferred
5. Compression: Gzip/Brotli should be enabled
6. Caching: Cache-Control headers should be present

Identify:
- Bottlenecks affecting user experience
- SEO impact from slow performance
- Resource optimization opportunities
- Network-level improvements`;

export const CDN_OPTIMIZATION_PROMPT = `Analyze CDN and caching configuration for {{domain}}.

Configuration:
{{config}}

Check:
1. Static asset caching policies
2. Edge caching effectiveness
3. Cache invalidation strategies
4. CDN geographic distribution
5. Compression at edge

Recommend improvements for:
- Cache hit ratio
- Time to first byte globally
- Bandwidth optimization`;
