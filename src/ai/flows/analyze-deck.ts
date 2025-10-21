
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a given card deck.
 *
 * @file         src/ai/flows/analyze-deck.ts
 * @exports    analyzeDeck - The main function to analyze a card deck.
 * @exports    AnalyzeDeckInput - The input type for the function.
 * @exports    AnalyzeDeckOutput - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { CardData } from '@/components/card-editor';

// We can't pass the full CardData object to the prompt, so we select the fields we need.
const CardForAnalysisSchema = z.object({
  name: z.string(),
  manaCost: z.number(),
  attack: z.number(),
  defense: z.number(),
  cardType: z.enum(['creature', 'spell', 'artifact', 'land']),
  creatureType: z.enum(['none', 'angel', 'demon', 'machine']).optional().describe('クリーチャーの種族'),
  abilities: z.string(),
});

const AnalyzeDeckInputSchema = z.object({
  deck: z.array(CardForAnalysisSchema),
});
export type AnalyzeDeckInput = z.infer<typeof AnalyzeDeckInputSchema>;

const AnalyzeDeckOutputSchema = z.object({
  strategy: z.string().describe('デッキの主要な戦略（例：アグロ、コントロール、ミッドレンジ、コンボ）。'),
  strengths: z.string().describe('デッキの長所や得意な戦術。'),
  weaknesses: z.string().describe('デッキの弱点や苦手な戦術。'),
  counterStrategy: z.string().describe('このデッキに対する効果的なカウンターストラテジー。'),
});
export type AnalyzeDeckOutput = z.infer<typeof AnalyzeDeckOutputSchema>;

export async function analyzeDeck(input: AnalyzeDeckInput): Promise<AnalyzeDeckOutput> {
  return analyzeDeckFlow(input);
}

const analyzeDeckPrompt = ai.definePrompt({
  name: 'analyzeDeckPrompt',
  input: { schema: AnalyzeDeckInputSchema },
  output: { schema: AnalyzeDeckOutputSchema },
  prompt: `あなたはプロのカードゲームアナリストです。以下のカードデッキリストを分析し、その特徴を詳細に報告してください。すべて日本語で回答してください。

デッキリスト:
{{#each deck}}
- {{name}} (コスト:{{manaCost}}, ATK:{{attack}}, DEF:{{defense}}, タイプ:{{cardType}}{{#if creatureType}} - {{creatureType}}{{/if}}, 能力:{{abilities}})
{{/each}}

分析項目:
1.  **戦略 (strategy)**: このデッキの主なプレイスタイルや勝ち筋を分析してください（例：「序盤からクリーチャーを展開して速攻を仕掛けるアグロ戦略」「相手の行動を妨害し、後半に強力なカードで勝負を決めるコントロール戦略」など）。
2.  **長所 (strengths)**: このデッキがどのような状況や相手に対して強いかを説明してください。
3.  **弱点 (weaknesses)**: このデッキがどのような状況や相手に対して弱いかを説明してください。
4.  **カウンター戦略 (counterStrategy)**: このデッキに勝つためには、どのような戦略やカードタイプが有効かを具体的に提案してください。

以上の分析結果をJSON形式で出力してください。
`,
});

const analyzeDeckFlow = ai.defineFlow(
  {
    name: 'analyzeDeckFlow',
    inputSchema: AnalyzeDeckInputSchema,
    outputSchema: AnalyzeDeckOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeDeckPrompt(input);
    if (!output) {
      throw new Error('Deck analysis failed.');
    }
    return output;
  }
);
