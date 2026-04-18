# AI Integration Setup Guide

## Gemini API Configuration

### 1. Get API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key for use in your application

### 2. Environment Configuration

Add to your environment variables:

```bash
# .env.local
GOOGLE_GEMINI_API_KEY=your_api_key_here
AI_PROVIDER=gemini
AI_MODEL=gemini-2.0-flash  # or gemini-2.5-flash
```

### 3. Usage in Code

```typescript
import { runScan } from '@/lib/scanners';

// Basic scan without AI
const result = await runScan('example.com', { mode: 'security' });

// AI-enhanced scan
const aiResult = await runScan('example.com', {
  mode: 'security',
  ai: {
    provider: 'gemini',
    apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
    model: 'gemini-2.0-flash',
    enabled: true,
  },
});

// Access AI analysis
if (result.aiAnalysis) {
  console.log('AI Summary:', result.aiAnalysis.aiSummary);
  console.log('AI Findings:', result.aiAnalysis.aiFindings);
  console.log('Recommendations:', result.aiAnalysis.recommendations);
}
```

## Architecture Overview

```
lib/ai/
├── providers/
│   ├── base.ts          # Abstract provider class
│   └── gemini.ts        # Gemini implementation
├── prompts/
│   ├── security.ts      # Security analysis prompts
│   ├── performance.ts   # Performance analysis prompts
│   └── pentest.ts       # Pentest analysis prompts
├── types.ts             # TypeScript interfaces
└── index.ts             # Main orchestrator
```

### Provider Pattern
The AI layer uses a provider pattern for extensibility:
- **BaseAIProvider**: Abstract class with common functionality
- **GeminiProvider**: Google Gemini implementation
- Easy to add: OpenAI, Anthropic, local models

### Scan Integration
AI analysis runs after the traditional scan completes:
1. Traditional scanners collect raw data
2. AI provider analyzes the structured data
3. AI findings are merged with original findings
4. Results include both deterministic and AI insights

## API Route Integration

Update your API route to support AI-enhanced scans:

```typescript
// app/api/scan/route.ts
import { runScan, type ScanOptions } from '@/lib/scanners';

export async function POST(request: Request) {
  const body = await request.json();
  const { domain, mode, enableAI } = body;
  
  const options: ScanOptions = {
    mode,
    ai: enableAI ? {
      provider: 'gemini',
      apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
      enabled: true,
    } : undefined,
  };
  
  const result = await runScan(domain, options);
  return Response.json(result);
}
```

## Cost Considerations

- **Gemini 2.0 Flash**: Fast, efficient, excellent for security analysis
- **Gemini 2.5 Pro**: Highest quality for extremely complex assessments
- Typical scan: ~1000-2000 tokens per analysis

## Security Notes

- API keys are server-side only (Route Handlers)
- Never expose API keys in client-side code
- Consider rate limiting for AI-enhanced endpoints

## Troubleshooting

### API Errors
- Check API key is valid and has quota
- Verify model name is correct
- Check network connectivity to Google APIs

### Parse Errors
- AI responses are validated before use
- If parsing fails, original scan results are returned
- Check provider implementation for prompt tuning
