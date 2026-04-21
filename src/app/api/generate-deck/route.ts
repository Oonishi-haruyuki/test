import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateDeck } from '@/ai/flows/generate-deck';

const requestSchema = z.object({
  theme: z.string().min(1),
  cardCount: z.number().int().min(1).max(60),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = requestSchema.parse(body);
    const result = await generateDeck(input);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate deck';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
