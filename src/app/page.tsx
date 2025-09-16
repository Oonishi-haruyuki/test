"use client";

import { useState } from "react";
import type { CardData } from "@/components/card-editor";
import { CardEditor } from "@/components/card-editor";
import { CardPreview } from "@/components/card-preview";
import { placeholderImages } from "@/lib/placeholder-images";

const defaultImage = placeholderImages.find(p => p.id === 'card-art-1');

export default function Home() {
  const [cardData, setCardData] = useState<CardData>({
    theme: "fantasy",
    name: "Mystic Dragon",
    manaCost: 5,
    attack: 4,
    defense: 4,
    cardType: "creature",
    rarity: "rare",
    abilities: "Flying\nWhen this creature enters the battlefield, draw a card.",
    flavorText: "Its scales shimmer with the secrets of the cosmos.",
    imageUrl: defaultImage?.imageUrl || "https://picsum.photos/seed/cardcraft/400/300",
    imageHint: defaultImage?.imageHint || "fantasy landscape",
  });

  return (
    <main>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 xl:gap-12">
        <div className="lg:col-span-2">
          <CardEditor cardData={cardData} setCardData={setCardData} />
        </div>
        <div className="lg:col-span-3 flex items-start justify-center">
            <div className="sticky top-8 w-full max-w-md">
            <CardPreview {...cardData} />
          </div>
        </div>
      </div>
    </main>
  );
}
