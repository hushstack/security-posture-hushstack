/**
 * AI Service Types
 * Type definitions for AI-enhanced security analysis
 */

import type { SecurityFinding, FindingSeverity, FindingCategory } from '@/lib/scanners/types';

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIAnalysisRequest {
  domain: string;
  scanMode: 'security' | 'performance' | 'pentest';
  rawData: Record<string, unknown>;
  context?: string;
}

export interface AIAnalysisResponse {
  findings: AIFinding[];
  summary: string;
  riskAssessment?: RiskAssessment;
  recommendations: AIRecommendation[];
  aiMetadata?: AIMetadata;
}

export interface AIFinding {
  id: string;
  category: FindingCategory;
  title: string;
  description: string;
  severity: FindingSeverity;
  confidence: number; // 0-100
  evidence?: string[];
  cwe?: string; // CWE ID if applicable
  cvss?: number; // CVSS score if applicable
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  attackVectors: AttackVector[];
  businessImpact: string;
}

export interface AttackVector {
  name: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface AIRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  implementation: string;
  effort: 'low' | 'medium' | 'high';
}

export interface AIEnhancedScanResult {
  originalFindings: SecurityFinding[];
  aiFindings: AIFinding[];
  aiSummary: string;
  recommendations: AIRecommendation[];
  aiMetadata: AIMetadata;
}

export interface AIMetadata {
  modelUsed: string;
  analysisDuration: number;
  confidenceScore: number;
  tokensUsed?: number;
  timestamp: string;
}

// Provider interface for pluggable AI services
export interface AIProvider {
  readonly name: string;
  readonly version: string;
  
  analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse>;
  analyzeSecurity(rawData: Record<string, unknown>, domain: string): Promise<AIAnalysisResponse>;
  analyzePerformance(rawData: Record<string, unknown>, domain: string): Promise<AIAnalysisResponse>;
  analyzePentest(rawData: Record<string, unknown>, domain: string): Promise<AIAnalysisResponse>;
}
