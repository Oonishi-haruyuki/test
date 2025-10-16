
export interface ShopItem {
    id: string;
    name: string;
    description?: string;
    url: string;
    price: number;
}

interface ShopItems {
    frames: ShopItem[];
    backs: ShopItem[];
    artifacts: ShopItem[];
    animations: ShopItem[];
    materials: ShopItem[];
}

export const shopItems: ShopItems = {
    frames: [
        {
            id: 'frame-royal-gold',
            name: 'ロイヤルゴールド',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/frames/frame_gold.png',
            price: 1000,
        },
        {
            id: 'frame-ancient-wood',
            name: 'エンシェントウッド',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/frames/frame_wood.png',
            price: 1000,
        },
        {
            id: 'frame-techno-blue',
            name: 'テクノブルー',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/frames/frame_techno.png',
            price: 1500,
        },
        {
            id: 'frame-demonic-purple',
            name: 'デモニックパープル',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/frames/frame_demonic.png',
            price: 2000,
        },
    ],
    backs: [
        {
            id: 'back-default',
            name: 'デフォルト',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/backs/back_default.png',
            price: 0,
        },
        {
            id: 'back-blue-gem',
            name: 'ブルーゲム',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/backs/back_blue_gem.png',
            price: 500,
        },
        {
            id: 'back-red-dragon',
            name: 'レッドドラゴン',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/backs/back_red_dragon.png',
            price: 500,
        },
        {
            id: 'back-forest-spirit',
            name: 'フォレストスピリット',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/backs/back_green_spirit.png',
            price: 500,
        },
        {
            id: 'back-rich-red',
            name: 'リッチレッド',
            url: 'https://via.placeholder.com/400x560/b91c1c/FFFFFF?text=%20',
            price: 500,
        },
        {
            id: 'back-ocean-blue',
            name: 'オーシャンブルー',
            url: 'https://via.placeholder.com/400x560/0d9488/FFFFFF?text=%20',
            price: 500,
        },
        {
            id: 'back-mystic-purple',
            name: 'ミスティックパープル',
            url: 'https://via.placeholder.com/400x560/7e22ce/FFFFFF?text=%20',
            price: 500,
        },
        {
            id: 'back-slate-gray',
            name: 'スレートグレー',
            url: 'https://via.placeholder.com/400x560/475569/FFFFFF?text=%20',
            price: 500,
        },
    ],
    artifacts: [
        {
            id: 'artifact-hp-boost',
            name: '生命のアミュレット',
            description: 'AI対戦開始時のHPが+5される。(合計25)',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/artifacts/amulet.png',
            price: 5000,
        },
        {
            id: 'artifact-hand-boost',
            name: 'マナの水晶',
            description: 'AI対戦開始時の手札が+1枚される。(合計6枚)',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/artifacts/crystal.png',
            price: 7500,
        },
        {
            id: 'artifact-mana-boost',
            name: 'マナの指輪',
            description: 'AI対戦開始時の最大マナが+1される。(2からスタート)',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/artifacts/ring.png',
            price: 10000,
        },
    ],
    animations: [
        {
            id: 'anim-flip',
            name: 'ノーマルフリップ',
            description: 'カードが裏から表に回転します。',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/animations/anim_flip.gif',
            price: 0,
        },
        {
            id: 'anim-shake-flip',
            name: 'シェイクフリップ',
            description: 'カードが揺れながらダイナミックに回転します。',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/animations/anim_shake.gif',
            price: 2000,
        }
    ],
    materials: [
        {
            id: 'dragon-soul',
            name: '竜の魂',
            description: 'ドラゴンの進化に必要とされる貴重な素材。',
            url: 'https://storage.googleapis.com/card-crafter-studio.appspot.com/materials/dragon_soul.png',
            price: 2500,
        }
    ]
};
