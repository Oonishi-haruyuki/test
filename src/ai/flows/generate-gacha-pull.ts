
'use server';

/**
 * @fileOverview Defines a Genkit flow for simulating a gacha pull to generate random cards.
 *
 * @file         src/ai/flows/generate-gacha-pull.ts
 * @exports    generateGachaPull - The main function to perform a gacha pull.
 * @exports    GenerateGachaPullInput - The input type for the function.
 * @exports    GenerateGachaPullOutput - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Rarity } from '@/components/card-editor';

const THEMES = ['ファンタジー', 'SF', 'モダン', 'サイバーパンク', 'スチームパンク', 'ホラー', '神話', '海賊', '西部劇', '古代エジプト'];

const CardSchemaForGacha = z.object({
    name: z.string().describe('カードの名前。'),
    manaCost: z.number().describe('マナコスト。レアリティに応じて1から10の範囲で。'),
    attack: z.number().describe('クリーチャーの攻撃力。呪文の場合は0。'),
    defense: z.number().describe('クリーチャーの防御力。呪文の場合は0。'),
    cardType: z.enum(['creature', 'spell']).describe('カードの種類。「クリーチャー」または「呪文」のいずれか。'),
    creatureType: z.enum(['none', 'human', 'elf', 'dwarf', 'goblin', 'orc', 'undead', 'dragon', 'beast', 'elemental', 'soldier', 'wizard', 'spirit', 'angel', 'demon', 'machine']).optional().describe('クリーチャーの場合の種族。呪文の場合は常に"none"。'),
    rarity: z.enum(['common', 'uncommon', 'rare', 'mythic']).describe('指定されたカードのレアリティ。'),
    abilities: z.string().describe('カードの能力。簡潔かつユニークに記述する。'),
    flavorText: z.string().describe('カードのフレーバーテキスト。世界観を表す短いテキスト。'),
    imageHint: z.string().describe('カードの画像生成のためのヒント（英語、最大2単語）。'),
});
type CardForGacha = z.infer<typeof CardSchemaForGacha>;

const GenerateGachaPullInputSchema = z.object({
  count: z.number().describe('生成するカードの枚数。'),
  allowedRarities: z.array(z.enum(['common', 'uncommon', 'rare', 'mythic'])).optional().describe('許可されるレアリティのリスト。指定しない場合は全レアリティが対象。'),
});
export type GenerateGachaPullInput = z.infer<typeof GenerateGachaPullInputSchema>;

const GenerateGachaPullOutputSchema = z.object({
  cards: z.array(CardSchemaForGacha),
});
export type GenerateGachaPullOutput = z.infer<typeof GenerateGachaPullOutputSchema>;


const generateCardPrompt = ai.definePrompt({
    name: 'generateSingleCardForGachaPrompt',
    input: {
      schema: z.object({
        theme: z.string(),
        rarity: z.string(),
      }),
    },
    output: { schema: CardSchemaForGacha },
    prompt: `あなたは創造的なカードゲームデザイナーです。指定されたテーマとレアリティに基づいて、ユニークなカードを1枚生成してください。すべて日本語で回答してください。

テーマ: {{{theme}}}
レアリティ: {{{rarity}}}

以下のガイドラインに従ってください:
- レアリティが高いほど、より強力でユニークな能力を持つようにしてください。
- カード名はテーマに沿った、ユニークで喚情的なものにしてください。
- imageHintはカードのイラストをイメージした英語のキーワード（2単語以内）にしてください。
- 必ずしもクリーチャーである必要はありません。呪文カードも生成してください。
- クリーチャーカードを生成する際は、適切な種族(creatureType)を設定してください。呪文の場合はcreatureTypeを'none'にしてください。

**能力に関するルール:**
- 能力の説明は非常に簡潔にしてください。長文は避けてください。
- 能力は「クリーチャー1体に2ダメージを与える」「カードを1枚引く」「クリーチャー1体の攻撃力を+2する」のように、シンプルで理解しやすいものにしてください。
- プレイヤーのライフに直接ダメージを与える能力は、極力生成しないでください。クリーチャーへのダメージや能力値の変更、一時的な行動不能（束縛）などを優先してください。
`,
});

const generateGachaPullFlow = ai.defineFlow(
  {
    name: 'generateGachaPullFlow',
    inputSchema: GenerateGachaPullInputSchema,
    outputSchema: GenerateGachaPullOutputSchema,
  },
  async ({ count, allowedRarities }) => {
    const rarityProbabilities: { [key in Rarity]: number } = {
        common: 0.75,
        uncommon: 0.20,
        rare: 0.045,
        mythic: 0.005,
    };

    const determineRarity = (): Rarity => {
        let probabilities = rarityProbabilities;
        let availableRarities: Rarity[] = ['common', 'uncommon', 'rare', 'mythic'];

        if (allowedRarities && allowedRarities.length > 0) {
            availableRarities = allowedRarities;
            const total = availableRarities.reduce((sum, r) => sum + (rarityProbabilities[r] || 0), 0);
            if (total > 0) {
                 probabilities = {} as { [key in Rarity]: number };
                 availableRarities.forEach(r => {
                     probabilities[r] = (rarityProbabilities[r] || 0) / total;
                 });
            } else {
                // If filtered rarities have no probability, distribute equally.
                 availableRarities.forEach(r => {
                     probabilities[r] = 1 / availableRarities.length;
                 });
            }
        }

        const rand = Math.random();
        let cumulative = 0;
        for (const r of availableRarities) {
            cumulative += probabilities[r] || 0;
            if (rand < cumulative) {
                return r;
            }
        }
        return availableRarities[availableRarities.length - 1] || 'common'; // Fallback
    };
    
    const cardPromises: Promise<CardForGacha>[] = [];

    for (let i = 0; i < count; i++) {
        const rarity = determineRarity();
        const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
        
        const cardPromise = (async () => {
            const { output } = await generateCardPrompt({ theme, rarity });
            if (!output) {
                throw new Error(`Failed to generate card for theme ${theme} and rarity ${rarity}`);
            }
            return { ...output, rarity }; // Ensure the correct rarity is set
        })();
        cardPromises.push(cardPromise);
    }
    
    const cards = await Promise.all(cardPromises);

    return { cards };
  }
);


export async function generateGachaPull(input: GenerateGachaPullInput): Promise<GenerateGachaPullOutput> {
    return generateGachaPullFlow(input);
}
