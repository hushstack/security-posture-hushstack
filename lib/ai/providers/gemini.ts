/**
 * Google Gemini AI Provider
 * Implementation of AIProvider for Google's Gemini API
 */

import { BaseAIProvider } from './base';
import { 
  SECURITY_SYSTEM_PROMPT,
  PERFORMANCE_SYSTEM_PROMPT,
  PENTEST_SYSTEM_PROMPT 
} from '../prompts';
import { securityLogger } from '@/lib/security/logger';
import type {
  AIAnalysisRequest,
  AIAnalysisResponse,
  AIProviderConfig,
} from '@/lib/ai/types';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiProvider extends BaseAIProvider {
  readonly name = 'Gemini';
  readonly version = '1.5';
  
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private model: string;

  constructor(config: AIProviderConfig) {
    super(config);
    this.model = config.model || 'gemini-flash-latest';
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const startTime = Date.now();
    
    // Log AI analysis start
    securityLogger.aiAnalysisStarted(request.domain, this.model);
    
    try {
      const prompt = this.buildPrompt(request);
      const response = await this.callGeminiAPI(prompt);
      
      const analysis = this.parseJSONResponse<AIAnalysisResponse>(response);
      
      const duration = Date.now() - startTime;
      
      // Log AI analysis completion
      securityLogger.aiAnalysisCompleted(request.domain, this.model, duration);
      
      return {
        ...analysis,
        aiMetadata: {
          modelUsed: this.model,
          analysisDuration: duration,
          confidenceScore: this.calculateConfidence(analysis),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log AI analysis failure
      securityLogger.aiAnalysisFailed(request.domain, this.model, errorMessage);
      
      throw error;
    }
  }

  async analyzeSecurity(
    rawData: Record<string, unknown>,
    domain: string
  ): Promise<AIAnalysisResponse> {
    return this.analyze({
      domain,
      scanMode: 'security',
      rawData,
      context: SECURITY_SYSTEM_PROMPT,
    });
  }

  async analyzePerformance(
    rawData: Record<string, unknown>,
    domain: string
  ): Promise<AIAnalysisResponse> {
    return this.analyze({
      domain,
      scanMode: 'performance',
      rawData,
      context: PERFORMANCE_SYSTEM_PROMPT,
    });
  }

  async analyzePentest(
    rawData: Record<string, unknown>,
    domain: string
  ): Promise<AIAnalysisResponse> {
    return this.analyze({
      domain,
      scanMode: 'pentest',
      rawData,
      context: PENTEST_SYSTEM_PROMPT,
    });
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    return this.withRetry(
      async () => {
        const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.config.apiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: this.config.temperature ?? this.defaultTemperature,
              maxOutputTokens: this.config.maxTokens ?? this.defaultMaxTokens,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`${this.name} API error: ${response.status} - ${errorText}`) as Error & { status?: number };
          error.status = response.status;
          throw error;
        }

        const data = await response.json() as GeminiResponse;
        
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error(`${this.name}: Empty response from API`);
        }

        return data.candidates[0].content.parts[0].text;
      },
      (error) => {
        const status = (error as { status?: number })?.status;
        // Retry on transient errors: 408 (Timeout), 429 (Rate Limit), 500 (Internal Error), 503 (Service Unavailable), 504 (Gateway Timeout)
        return status === 408 || status === 429 || status === 500 || status === 503 || status === 504 || 
               (error instanceof TypeError && error.message === 'Failed to fetch');
      }
    );
  }

  private buildPrompt(request: AIAnalysisRequest): string {
    const { scanMode, rawData, context, domain } = request;
    
    // Sanitize raw data to prevent prompt injection and data leakage
    const { data: sanitizedData, redactedFields } = this.sanitizeScanData(rawData);
    
    // Log if sensitive data was redacted
    if (redactedFields.length > 0) {
      securityLogger.sensitiveDataRedacted(domain, redactedFields);
    }
    
    return `${context}

DOMAIN: ${domain}
SCAN MODE: ${scanMode}

RAW SCAN DATA:
${JSON.stringify(sanitizedData, null, 2)}

TASK:
Analyze the RAW SCAN DATA and provide findings in EXACT JSON format.
Ensure all strings are properly escaped.
Do not include any conversational text outside the JSON.
Double check that the JSON is complete and valid before finishing.

Focus on:
1. Identifying security or performance issues with specific evidence from the data
2. Providing severity ratings (critical, bad, warning, info, good)
3. Suggesting concrete remediation steps
4. Assigning confidence scores (0-100) based on evidence clarity`;
  }

  /**
   * Sanitizes scan data before sending to AI provider
   * - Removes potential API keys, tokens, passwords
   * - Limits data size to prevent prompt injection
   * - Removes potentially malicious content
   */
  private sanitizeScanData(data: Record<string, unknown>): { data: Record<string, unknown>; redactedFields: string[] } {
    const sensitivePatterns = [
      /api[_-]?key/i,
      /apikey/i,
      /password/i,
      /secret/i,
      /token/i,
      /auth/i,
      /credential/i,
      /private[_-]?key/i,
      /access[_-]?key/i,
      /bearer/i,
    ];

    const maxStringLength = 1000;
    const maxArrayLength = 100;
    const maxObjectKeys = 50;
    const redactedFields: string[] = [];

    const sanitize = (value: unknown, depth = 0, keyPath = ''): unknown => {
      // Prevent deep nesting
      if (depth > 5) {
        return '[Max depth reached]';
      }

      if (typeof value === 'string') {
        // Check for sensitive patterns
        const lowerValue = value.toLowerCase();
        for (const pattern of sensitivePatterns) {
          if (pattern.test(lowerValue)) {
            if (keyPath && !redactedFields.includes(keyPath)) {
              redactedFields.push(keyPath);
            }
            return '[REDACTED]';
          }
        }
        
        // Limit string length
        if (value.length > maxStringLength) {
          return value.substring(0, maxStringLength) + '...[truncated]';
        }
        
        // Remove potentially dangerous characters
        return value
          .replace(/[<>]/g, '') // Remove HTML tags
          .replace(/\x00-\x08\x0b\x0c\x0e-\x1f/g, ''); // Remove control chars
      }

      if (typeof value === 'number' || typeof value === 'boolean') {
        return value;
      }

      if (value === null || value === undefined) {
        return value;
      }

      if (Array.isArray(value)) {
        // Limit array length
        const limitedArray = value.slice(0, maxArrayLength);
        return limitedArray.map((item, index) => sanitize(item, depth + 1, `${keyPath}[${index}]`));
      }

      if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj);
        
        // Limit object keys
        if (keys.length > maxObjectKeys) {
          return '[Object too large]';
        }

        const sanitized: Record<string, unknown> = {};
        for (const key of keys) {
          // Skip sensitive keys
          const lowerKey = key.toLowerCase();
          const currentPath = keyPath ? `${keyPath}.${key}` : key;
          if (sensitivePatterns.some(p => p.test(lowerKey))) {
            sanitized[key] = '[REDACTED]';
            redactedFields.push(currentPath);
          } else {
            sanitized[key] = sanitize(obj[key], depth + 1, currentPath);
          }
        }
        return sanitized;
      }

      return '[Unsupported type]';
    };

    return { data: sanitize(data, 0, '') as Record<string, unknown>, redactedFields };
  }

  private calculateConfidence(analysis: AIAnalysisResponse): number {
    if (!analysis.findings?.length) return 0;
    
    const avgConfidence = analysis.findings.reduce(
      (sum, f) => sum + (f.confidence || 50),
      0
    ) / analysis.findings.length;
    
    return Math.round(avgConfidence);
  }
}
