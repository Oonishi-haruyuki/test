import type { CardSchema } from '@/components/card-editor';

export type GenerateDeckInput = {
  theme: string;
  cardCount: number;
};

export type GenerateDeckOutput = {
  deck: CardSchema[];
};

export async function generateDeckClient(input: GenerateDeckInput): Promise<GenerateDeckOutput> {
  const response = await fetch('/api/generate-deck', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error ?? 'デッキ生成APIの呼び出しに失敗しました');
  }

  return (await response.json()) as GenerateDeckOutput;
}
