import type { CardSchema } from '@/components/card-editor';
import type { ApiResponse } from '@/lib/api-contract';
import { createMockDeck } from '@/lib/mock-deck';

export type GenerateDeckInput = {
  theme: string;
  cardCount: number;
};

export type GenerateDeckOutput = {
  deck: CardSchema[];
  usedMockFallback?: boolean;
};

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

export async function generateDeckClient(input: GenerateDeckInput): Promise<GenerateDeckOutput> {
  try {
    const response = await fetch('/api/generate-deck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as ApiResponse<GenerateDeckOutput> | { deck?: CardSchema[] } | null;

    if (response.ok && body) {
      if ('ok' in body && body.ok && body.data && Array.isArray(body.data.deck)) {
        return {
          deck: body.data.deck,
          usedMockFallback: body.meta?.fallback === 'mock',
        };
      }

      if ('deck' in body && Array.isArray(body.deck)) {
        return {
          deck: body.deck,
          usedMockFallback: false,
        };
      }
    }

    console.warn('generateDeck returned non-standard or error response, falling back to mock deck generator.');
    return {
      deck: createMockDeck(input.theme, input.cardCount),
      usedMockFallback: true,
    };
  } catch (error) {
    console.warn('generateDeckClient fetch failed, falling back to mock deck generator:', error);
    return {
      deck: createMockDeck(input.theme, input.cardCount),
      usedMockFallback: true,
    };
  }
}
