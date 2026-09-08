
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
  creatureType: z.enum(['none', 'human', 'elf', 'dwarf', 'goblin', 'orc', 'undead', 'dragon', 'beast', 'elemental', 'soldier', 'wizard', 'spirit', 'angel', 'demon', 'machine']).optional().describe('クリーチャーの種族'),
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

function generateFallbackDeckAnalysis(input: AnalyzeDeckInput): AnalyzeDeckOutput {
  const cards = input?.deck ?? [];
  const totalCards = cards.length;
  if (totalCards === 0) {
    return {
      strategy: 'カードが登録されていません。',
      strengths: '特になし',
      weaknesses: 'デッキが空です。',
      counterStrategy: '特になし',
    };
  }

  const creatures = cards.filter(c => c.cardType === 'creature');
  const spells = cards.filter(c => c.cardType === 'spell');
  const totalMana = cards.reduce((sum, c) => sum + (c.manaCost || 0), 0);
  const avgMana = (totalMana / totalCards).toFixed(1);
  const highAtkCreatures = creatures.filter(c => (c.attack || 0) >= 4);

  let strategy = 'ミッドレンジ戦略: 安定したマナカーブで中盤の主導権を狙うバランス型デッキです。';
  if (parseFloat(avgMana) <= 2.8) {
    strategy = 'アグロ速攻戦略: 低コストカードを素早く展開し、相手の体制が整う前にライフを削り切る速攻型です。';
  } else if (parseFloat(avgMana) >= 4.2) {
    strategy = 'コントロール/レイトゲーム戦略: 後半の大型クリーチャーや高コストカードで逆転を狙う重厚な構成です。';
  } else if (spells.length > creatures.length) {
    strategy = 'スペルコントロール戦略: 呪文による戦局のコントロールと除去を重視した戦術です。';
  }

  const strengths = `クリーチャー比率(${creatures.length}/${totalCards})、平均コスト${avgMana}。${highAtkCreatures.length > 0 ? `高攻撃力アタッカー(${highAtkCreatures.length}枚)による打点力があります。` : '手堅い展開力を持っています。'}`;
  const weaknesses = parseFloat(avgMana) > 4 ? '序盤の攻撃に対する防御が手薄になりやすい点です。' : '手札の消費が早く、後半の息切れに注意が必要です。';
  const counterStrategy = parseFloat(avgMana) <= 3 ? '全体除去呪文や守備力の高いブロッカーを配置して序盤の攻勢を防ぎましょう。' : '序盤からテンポよく攻め立て、大型カードが出る前に決着を狙いましょう。';

  return {
    strategy,
    strengths,
    weaknesses,
    counterStrategy,
  };
}

export async function analyzeDeck(input: AnalyzeDeckInput): Promise<AnalyzeDeckOutput> {
  try {
    return await analyzeDeckFlow(input);
  } catch (error) {
    console.warn('AI analyzeDeckFlow failed, providing rule-based analysis fallback:', error);
    return generateFallbackDeckAnalysis(input);
  }
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
