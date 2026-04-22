import type { CardSchema } from '@/components/card-editor';
import type { ApiResponse } from '@/lib/api-contract';

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
  const response = await fetch('/api/generate-deck', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const body = (await response.json().catch(() => null)) as ApiResponse<GenerateDeckOutput> | null;

  if (!response.ok) {
    if (body && !body.ok) {
      throw new ApiClientError(body.error.message, response.status, body.error.code);
    }

    throw new ApiClientError('デッキ生成APIの呼び出しに失敗しました', response.status);
  }

  if (body && body.ok) {
    return {
      ...body.data,
      usedMockFallback: body.meta?.fallback === 'mock',
    };
  }

  // Backward compatibility for legacy shape.
  return body as unknown as GenerateDeckOutput;
}
