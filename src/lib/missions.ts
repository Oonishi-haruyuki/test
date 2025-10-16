
export type MissionType = 'daily' | 'weekly' | 'monthly';

export interface Mission {
    id: string;
    type: MissionType;
    title: string;
    description: string;
    action: 'win-game' | 'play-game' | 'create-cards' | 'pull-gacha' | 'win-daily-challenge';
    goal: number;
    reward: number;
    progress: number;
    claimed: boolean;
}

export const allMissions: Mission[] = [
    // Daily
    {
        id: 'daily-win-1',
        type: 'daily',
        title: 'AI対戦で1回勝利する',
        description: '難易度問わず、AIとの対戦で勝利しよう。',
        action: 'win-game',
        goal: 1,
        reward: 50,
        progress: 0,
        claimed: false,
    },
    {
        id: 'daily-play-3',
        type: 'daily',
        title: 'AI対戦を3回プレイする',
        description: '勝敗問わず、AIと3回対戦しよう。',
        action: 'play-game',
        goal: 3,
        reward: 30,
        progress: 0,
        claimed: false,
    },
    {
        id: 'daily-gacha-1',
        type: 'daily',
        title: 'ガチャを1回引く',
        description: 'カードガチャを1回以上引いてみよう。',
        action: 'pull-gacha',
        goal: 1,
        reward: 20,
        progress: 0,
        claimed: false,
    },
    {
        id: 'daily-challenge-win-1',
        type: 'daily',
        title: 'デイリーチャレンジに勝利する',
        description: '今日の指定デッキで上級AIに勝利しよう。',
        action: 'win-daily-challenge',
        goal: 1,
        reward: 150,
        progress: 0,
        claimed: false,
    },
    // Weekly
    {
        id: 'weekly-win-5',
        type: 'weekly',
        title: 'AI対戦で5回勝利する',
        description: '1週間でAIに5回勝利しよう。',
        action: 'win-game',
        goal: 5,
        reward: 250,
        progress: 0,
        claimed: false,
    },
    {
        id: 'weekly-create-10',
        type: 'weekly',
        title: 'カードを10枚作成する',
        description: '1週間で新しいカードを10枚作成しよう。',
        action: 'create-cards',
        goal: 10,
        reward: 150,
        progress: 0,
        claimed: false,
    },
    {
        id: 'weekly-gacha-10',
        type: 'weekly',
        title: 'ガチャを10回引く',
        description: '1週間でカードガチャを10回以上引いてみよう。',
        action: 'pull-gacha',
        goal: 10,
        reward: 100,
        progress: 0,
        claimed: false,
    },
    // Monthly
    {
        id: 'monthly-win-20',
        type: 'monthly',
        title: 'AI対戦で20回勝利する',
        description: '1ヶ月でAIに20回勝利しよう。',
        action: 'win-game',
        goal: 20,
        reward: 1000,
        progress: 0,
        claimed: false,
    },
    {
        id: 'monthly-create-50',
        type: 'monthly',
        title: 'カードを50枚作成する',
        description: '1ヶ月で新しいカードを50枚作成しよう。',
        action: 'create-cards',
        goal: 50,
        reward: 750,
        progress: 0,
        claimed: false,
    },
    {
        id: 'monthly-gacha-50',
        type: 'monthly',
        title: 'ガチャを50回引く',
        description: '1ヶ月でカードガチャを50回以上引いてみよう。',
        action: 'pull-gacha',
        goal: 50,
        reward: 500,
        progress: 0,
        claimed: false,
    },
];
