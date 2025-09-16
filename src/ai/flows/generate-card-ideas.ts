
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating card ideas based on a user-provided theme or prompt.
 *
 * The flow takes a theme or prompt as input and generates a card idea, including the card's name, abilities, and flavor text.
 *
 * @file         src/ai/flows/generate-card-ideas.ts
 * @exports    generateCardIdeas - The main function to generate card ideas.
 * @exports    GenerateCardIdeasInput - The input type for the generateCardIdeas function.
 * @exports    GenerateCardIdeasOutput - The output type for the generateCardIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCardIdeasInputSchema = z.object({
  theme: z
    .string()
    .describe('カードのアイデアを生成するためのテーマやプロンプト。'),
});
export type GenerateCardIdeasInput = z.infer<typeof GenerateCardIdeasInputSchema>;

const GenerateCardIdeasOutputSchema = z.object({
  cardName: z.string().describe('カードの名前。'),
  abilities: z.string().describe('カードの能力。'),
  flavorText: z.string().describe('カードのフレーバーテキスト。'),
});
export type GenerateCardIdeasOutput = z.infer<typeof GenerateCardIdeasOutputSchema>;

export async function generateCardIdeas(input: GenerateCardIdeasInput): Promise<GenerateCardIdeasOutput> {
  return generateCardIdeasFlow(input);
}

const generateCardIdeasPrompt = ai.definePrompt({
  name: 'generateCardIdeasPrompt',
  input: {schema: GenerateCardIdeasInputSchema},
  output: {schema: GenerateCardIdeasOutputSchema},
  prompt: `あなたは創造的なカードゲームデザイナーです。与えられたテーマやプロンプトに基づいて、ユニークなカードのアイデアを生成してください。すべて日本語で回答してください。

テーマ/プロンプト: {{{theme}}}

以下の点を考慮してください:
- カード名はテーマに関連し、喚情的であるべきです。
- 能力は面白く、バランスが取れているべきです。
- フレーバーテキストはカードに個性と深みを与えるべきです。

カードのアイデアを以下の形式で出力してください:
{
  "cardName": "[カード名]",
  "abilities": "[カードの能力]",
  "flavorText": "[フレーバーテキスト]"
}
`,
});

const generateCardIdeasFlow = ai.defineFlow(
  {
    name: 'generateCardIdeasFlow',
    inputSchema: GenerateCardIdeasInputSchema,
    outputSchema: GenerateCardIdeasOutputSchema,
  },
  async input => {
    const {output} = await generateCardIdeasPrompt(input);
    return output!;
  }
);
