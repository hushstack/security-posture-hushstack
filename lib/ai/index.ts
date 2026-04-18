/**
 * AI Orchestrator
 * Main entry point for AI-enhanced security analysis
 * Provides clean integration with existing scanners
 */

import { GeminiProvider } from './providers/gemini';
import type { AIProvider, AIEnhancedScanResult, AIAnalysisResponse, AIProviderConfig } from './types';
import type { ScanMode, ScanResult, SecurityFinding } from '@/lib/scanners/types';

// Provider registry for extensibility
const providers = new Map<string, new (config: AIProviderConfig) => AIProvider>();

export function registerProvider(
  name: string,
  provider: new (config: AIProviderConfig) => AIProvider
): void {
  providers.set(name.toLowerCase(), provider);
}

// Register built-in providers
registerProvider('gemini', GeminiProvider);

export interface AIOptions {
  provider?: 'gemini';
  apiKey?: string;
  model?: string;
  enabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export class AIOrchestrator {
  private provider: AIProvider | null = null;
  private enabled: boolean;

  constructor(options: AIOptions = {}) {
    this.enabled = options.enabled ?? !!options.apiKey;
    
    if (this.enabled && options.apiKey) {
      const ProviderClass = providers.get((options.provider || 'gemini').toLowerCase());
      if (ProviderClass) {
        this.provider = new ProviderClass({
          apiKey: options.apiKey,
          model: options.model,
          maxRetries: options.maxRetries,
          retryDelay: options.retryDelay,
        });
      }
    }
  }

  isEnabled(): boolean {
    return this.enabled && this.provider !== null;
  }

  async enhanceScan(
    scanResult: ScanResult,
    mode: ScanMode
  ): Promise<AIEnhancedScanResult | null> {
    if (!this.isEnabled()) {
      return null;
    }

    const startTime = Date.now();

    try {
      // Prepare raw data for AI analysis
      const rawData = this.prepareScanData(scanResult, mode);
      
      // Get AI analysis
      let aiResponse: AIAnalysisResponse;
      
      switch (mode) {
        case 'security':
          aiResponse = await this.provider!.analyzeSecurity(rawData, scanResult.domain);
          break;
        case 'performance':
          aiResponse = await this.provider!.analyzePerformance(rawData, scanResult.domain);
          break;
        case 'pentest':
          aiResponse = await this.provider!.analyzePentest(rawData, scanResult.domain);
          break;
        default:
          return null;
      }

      return {
        originalFindings: scanResult.findings,
        aiFindings: aiResponse.findings,
        aiSummary: aiResponse.summary,
        recommendations: aiResponse.recommendations,
        aiMetadata: aiResponse.aiMetadata || {
          modelUsed: 'unknown',
          analysisDuration: Date.now() - startTime,
          confidenceScore: 0,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[AI Orchestrator] Analysis failed:', error);
      return null;
    }
  }

  private prepareScanData(scanResult: ScanResult, mode: ScanMode): Record<string, unknown> {
    const baseData = {
      domain: scanResult.domain,
      score: scanResult.score,
      grade: scanResult.grade,
      headers: scanResult.headers,
      dns: scanResult.dns,
      ssl: scanResult.ssl,
    };

    switch (mode) {
      case 'performance':
        return {
          ...baseData,
          performance: scanResult.performance,
        };
      case 'pentest':
        return {
          ...baseData,
          pentest: scanResult.pentest,
        };
      case 'security':
      default:
        return baseData;
    }
  }

  // Merge AI findings with original findings
  static mergeFindings(
    original: SecurityFinding[],
    aiFindings: SecurityFinding[]
  ): SecurityFinding[] {
    const merged = [...original];
    
    for (const aiFinding of aiFindings) {
      // Check for duplicates by ID
      const exists = merged.some(f => f.id === aiFinding.id);
      if (!exists) {
        merged.push(aiFinding);
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, bad: 1, warning: 2, info: 3, good: 4 };
    return merged.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }
}

// Factory function for easy instantiation
export function createAI(options?: AIOptions): AIOrchestrator {
  return new AIOrchestrator(options);
}

// Re-export types
export type { AIProvider, AIEnhancedScanResult, AIAnalysisResponse } from './types';
export { GeminiProvider } from './providers/gemini';
