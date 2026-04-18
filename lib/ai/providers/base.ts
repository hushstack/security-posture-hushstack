/**
 * Base AI Provider
 * Abstract class for implementing AI providers with common functionality
 */

import type {
  AIProvider,
  AIAnalysisRequest,
  AIAnalysisResponse,
  AIProviderConfig,
} from '@/lib/ai/types';

export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;
  abstract readonly version: string;
  
  protected config: AIProviderConfig;
  protected defaultTemperature = 0.3;
  protected defaultMaxTokens = 4096;

  constructor(config: AIProviderConfig) {
    this.config = {
      temperature: this.defaultTemperature,
      maxTokens: this.defaultMaxTokens,
      ...config,
    };
    this.validateConfig();
  }

  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error(`${this.name}: API key is required`);
    }
  }

  abstract analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse>;
  
  abstract analyzeSecurity(
    rawData: Record<string, unknown>,
    domain: string
  ): Promise<AIAnalysisResponse>;

  abstract analyzePerformance(
    rawData: Record<string, unknown>,
    domain: string
  ): Promise<AIAnalysisResponse>;

  abstract analyzePentest(
    rawData: Record<string, unknown>,
    domain: string
  ): Promise<AIAnalysisResponse>;

  protected createSystemPrompt(): string {
    return `You are a security analysis AI assistant. Analyze security scan data and provide:
1. Security findings with severity ratings
2. Risk assessment
3. Actionable recommendations
4. Evidence-based analysis only

Respond in JSON format with:
{
  "findings": [...],
  "summary": "...",
  "riskAssessment": {...},
  "recommendations": [...]
}`;
  }

  protected sanitizeResponse(response: string): string {
    let sanitized = response.trim();
    
    // Remove markdown code blocks if present
    sanitized = sanitized.replace(/^```json\s*/i, '');
    sanitized = sanitized.replace(/^```\s*/i, '');
    sanitized = sanitized.replace(/```\s*$/i, '');
    
    // If the response still contains markdown blocks anywhere, try to extract the first JSON-like structure
    if (sanitized.includes('```')) {
      const match = sanitized.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        sanitized = match[1];
      }
    }
    
    return sanitized.trim();
  }

  protected parseJSONResponse<T>(response: string): T {
    const sanitized = this.sanitizeResponse(response);
    try {
      return JSON.parse(sanitized) as T;
    } catch (error) {
      // Fallback: try to find the first '{' and last '}'
      const firstBrace = sanitized.indexOf('{');
      const lastBrace = sanitized.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const extracted = sanitized.substring(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(extracted) as T;
        } catch (innerError) {
          // Continue to throw the original error with more context
        }
      }

      throw new Error(
        `${this.name}: Failed to parse AI response - ${error instanceof Error ? error.message : 'Unknown error'}. Response start: ${sanitized.substring(0, 100)}`
      );
    }
  }
}
