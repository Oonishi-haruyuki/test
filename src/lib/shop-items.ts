
export interface ShopItem {
    id: string;
    name: string;
    url: string;
    price: number;
}

interface ShopItems {
    frames: ShopItem[];
    backs: ShopItem[];
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
};
