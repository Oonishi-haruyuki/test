
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a deck of cards based on a theme.
 *
 * @file         src/ai/flows/generate-deck.ts
 * @exports    generateDeck - The main function to generate a card deck.
 * @exports    GenerateDeckInput - The input type for the generateDeck function.
 * @exports    GenerateDeckOutput - The output type for the generateDeck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CardSchemaForGeneration = z.object({
    name: z.string().describe('カードの名前。'),
    manaCost: z.number().describe('マナコスト。1から10の範囲。'),
    attack: z.number().describe('クリーチャーの攻撃力。呪文の場合は0。'),
    defense: z.number().describe('クリーチャーの防御力。呪文の場合は0。'),
    cardType: z.enum(['creature', 'spell']).describe('カードの種類。「クリーチャー」または「呪文」のいずれか。'),
    creatureType: z.enum(['none', 'human', 'elf', 'dwarf', 'goblin', 'orc', 'undead', 'dragon', 'beast', 'elemental', 'soldier', 'wizard', 'spirit', 'angel', 'demon', 'machine']).optional().describe('クリーチャーの場合の種族。呪文の場合は常に"none"。'),
    rarity: z.enum(['common', 'uncommon', 'rare', 'mythic']).describe('カードのレアリティ。「コモン」、「アンコモン」、「レア」、「神話レア」のいずれか。'),
    abilities: z.string().describe('カードの能力。簡潔に記述する。'),
    flavorText: z.string().describe('カードのフレーバーテキスト。世界観を表す短いテキスト。'),
    imageHint: z.string().describe('カードの画像生成のためのヒント（英語、最大2単語）。'),
});

const GenerateDeckInputSchema = z.object({
  theme: z.string().describe('デッキのテーマ（例：ファンタジー、SF）。'),
  cardCount: z.number().describe('生成するカードの枚数。'),
});
export type GenerateDeckInput = z.infer<typeof GenerateDeckInputSchema>;

const GenerateDeckOutputSchema = z.object({
    deck: z.array(CardSchemaForGeneration),
});
export type GenerateDeckOutput = z.infer<typeof GenerateDeckOutputSchema>;

export async function generateDeck(input: GenerateDeckInput): Promise<GenerateDeckOutput> {
  return generateDeckFlow(input);
}

const generateDeckPrompt = ai.definePrompt({
  name: 'generateDeckPrompt',
  input: {schema: GenerateDeckInputSchema},
  output: {schema: GenerateDeckOutputSchema},
  prompt: `あなたは創造的なカードゲームデザイナーです。指定されたテーマと枚数に基づいて、ユニークなカードデッキを生成してください。すべて日本語で回答してください。

テーマ: {{{theme}}}
枚数: {{{cardCount}}}

以下のガイドラインに従って、多様なカードを生成してください:
- クリーチャーカードと呪文カードをバランス良く含めてください。
- クリーチャーカードを生成する際は、適切な種族(creatureType)を設定してください。呪文の場合はcreatureTypeを'none'にしてください。
- マナコスト、レアリティを多様にしてください。
- カード名はテーマに沿った、ユニークで喚情的なものにしてください。
- 能力はテーマに合致し、面白く、バランスが取れているべきです。
- フレーバーテキストはカードに個性と深みを与える、短い文章にしてください。
- imageHintはカードのイラストをイメージした英語のキーワード（2単語以内）にしてください。

**能力に関するルール:**
- 能力の説明は非常に簡潔にしてください。長文は避けてください。
- 能力は「クリーチャー1体に2ダメージを与える」「カードを1枚引く」「クリーチャー1体の攻撃力を+2する」のように、シンプルで理解しやすいものにしてください。
- プレイヤーのライフに直接ダメージを与える能力は、極力生成しないでください。クリーチャーへのダメージや能力値の変更、一時的な行動不能（束縛）などを優先してください。

指定された枚数のカードを持つデッキを生成してください。
`,
});

const generateDeckFlow = ai.defineFlow(
  {
    name: 'generateDeckFlow',
    inputSchema: GenerateDeckInputSchema,
    outputSchema: GenerateDeckOutputSchema,
  },
  async input => {
    const {output} = await generateDeckPrompt(input);
    if (!output || !output.deck || output.deck.length !== input.cardCount) {
        throw new Error('Failed to generate the requested number of cards.');
    }
    return output;
  }
);
