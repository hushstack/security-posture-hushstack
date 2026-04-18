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
    
    const prompt = this.buildPrompt(request);
    const response = await this.callGeminiAPI(prompt);
    
    const analysis = this.parseJSONResponse<AIAnalysisResponse>(response);
    
    return {
      ...analysis,
      aiMetadata: {
        modelUsed: this.model,
        analysisDuration: Date.now() - startTime,
        confidenceScore: this.calculateConfidence(analysis),
        timestamp: new Date().toISOString(),
      },
    };
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
    
    return `${context}

DOMAIN: ${domain}
SCAN MODE: ${scanMode}

RAW SCAN DATA:
${JSON.stringify(rawData, null, 2)}

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

  private calculateConfidence(analysis: AIAnalysisResponse): number {
    if (!analysis.findings?.length) return 0;
    
    const avgConfidence = analysis.findings.reduce(
      (sum, f) => sum + (f.confidence || 50),
      0
    ) / analysis.findings.length;
    
    return Math.round(avgConfidence);
  }
}
