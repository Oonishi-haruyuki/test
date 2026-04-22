import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateDeck } from '@/ai/flows/generate-deck';
import { apiFailure, apiSuccess } from '@/lib/api-contract';
import { createMockDeck } from '@/lib/mock-deck';

const requestSchema = z.object({
  theme: z.string().min(1),
  cardCount: z.number().int().min(1).max(60),
});

function isProviderRateLimit(message: string): boolean {
  return /429\s*Too\s*Many\s*Requests|Quota exceeded/i.test(message);
}

function isProviderAuthOrPermissionError(message: string): boolean {
  return /API key|permission|unauthorized|401|403/i.test(message);
}

function shouldUseMockFallback(): boolean {
  return process.env.ENABLE_DECK_MOCK_FALLBACK === 'true';
}

export async function POST(request: Request) {
  let parsedInput: z.infer<typeof requestSchema> | null = null;

  try {
    const body = await request.json();
    parsedInput = requestSchema.parse(body);
    const result = await generateDeck(parsedInput);
    return NextResponse.json(apiSuccess(result));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        apiFailure('INVALID_REQUEST', 'Invalid request body', error.issues),
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to generate deck';

    if (isProviderRateLimit(message)) {
      if (parsedInput && shouldUseMockFallback()) {
        const deck = createMockDeck(parsedInput.theme, parsedInput.cardCount);
        return NextResponse.json(apiSuccess({ deck }, { fallback: 'mock' }), {
          status: 200,
          headers: {
            'x-deck-fallback': 'mock',
          },
        });
      }

      return NextResponse.json(
        apiFailure('RATE_LIMITED', 'Deck generation is rate-limited by the AI provider. Please retry later.'),
        { status: 429 }
      );
    }

    if (isProviderAuthOrPermissionError(message)) {
      if (parsedInput && shouldUseMockFallback()) {
        const deck = createMockDeck(parsedInput.theme, parsedInput.cardCount);
        return NextResponse.json(apiSuccess({ deck }, { fallback: 'mock' }), {
          status: 200,
          headers: {
            'x-deck-fallback': 'mock',
          },
        });
      }

      return NextResponse.json(
        apiFailure('UPSTREAM_AUTH_FAILED', 'AI provider authentication/permission failed. Check server API key configuration.'),
        { status: 503 }
      );
    }

    return NextResponse.json(apiFailure('INTERNAL_ERROR', message), { status: 500 });
  }
}
