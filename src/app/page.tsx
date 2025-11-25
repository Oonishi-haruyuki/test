
"use client";

import { useState, useRef } from "react";
import type { CardData } from "@/components/card-editor";
import { CardEditor } from "@/components/card-editor";
import { CardPreview } from "@/components/card-preview";

export default function Home() {
  const [cardData, setCardData] = useState<CardData>({
    theme: "fantasy",
    name: "ミスティックドラゴン",
    manaCost: 5,
    attack: 4,
    defense: 4,
    cardType: "creature",
    rarity: "rare",
    abilities: "飛行\nこのクリーチャーが戦場に出たとき、カードを1枚引く。",
    flavorText: "その鱗は宇宙の秘密を映してきらめく。",
    imageUrl: "https://picsum.photos/seed/cardcraft/400/300",
    imageHint: "fantasy landscape",
  });
  const cardPreviewRef = useRef<HTMLDivElement>(null);
  const [isImageGenerating, setIsImageGenerating] = useState(false);

  return (
    <main className="mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 xl:gap-12">
        <div className="lg:col-span-2">
          <CardEditor 
            cardData={cardData} 
            setCardData={setCardData} 
            cardPreviewRef={cardPreviewRef} 
            isImageGenerating={isImageGenerating}
            setIsImageGenerating={setIsImageGenerating}
          />
        </div>
        <div className="lg:col-span-3 flex items-start justify-center">
          <div className="sticky top-8 w-full max-w-md">
            <CardPreview {...cardData} ref={cardPreviewRef} isImageGenerating={isImageGenerating} />
          </div>
        </div>
      </div>
    </main>
  );
}
