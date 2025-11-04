
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Gem, Shield, Sparkles, Swords, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { CardData, Rarity, CardType, CreatureType } from './card-editor';
import React from 'react';
import { Skeleton } from './ui/skeleton';

const rarityColorVar: Record<Rarity, string> = {
  common: 'hsl(var(--muted-foreground))',
  uncommon: 'hsl(var(--primary))',
  rare: 'hsl(var(--chart-1))',
  mythic: 'hsl(var(--chart-5))',
};

const rarityJapanese: Record<Rarity, string> = {
  common: 'コモン',
  uncommon: 'アンコモン',
  rare: 'レア',
  mythic: '神話レア',
};

const cardTypeJapanese: Record<CardType, string> = {
    creature: 'クリーチャー',
    spell: '呪文',
    artifact: 'アーティファクト',
    land: '土地',
};

const creatureTypeJapanese: Record<CreatureType, string> = {
    none: '',
    human: 'ヒューマン',
    elf: 'エルフ',
    dwarf: 'ドワーフ',
    goblin: 'ゴブリン',
    orc: 'オーク',
    undead: 'アンデッド',
    dragon: 'ドラゴン',
    beast: 'ビースト',
    elemental: 'エレメンタル',
    soldier: 'ソルジャー',
    wizard: 'ウィザード',
    spirit: 'スピリット',
    angel: '天使',
    demon: '悪魔',
    machine: '機械',
};

interface CardPreviewProps extends CardData {
    isImageGenerating?: boolean;
}

export const CardPreview = React.forwardRef<HTMLDivElement, CardPreviewProps>(({
  theme,
  name,
  manaCost,
  attack,
  defense,
  cardType,
  creatureType,
  rarity,
  abilities,
  flavorText,
  imageUrl,
  imageHint,
  frameImageUrl,
  isImageGenerating,
}, ref) => {
  const showStats = cardType === 'creature';

  const cardStyle = frameImageUrl ? {
    backgroundImage: `url(${frameImageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: 'white',
  } : {};

  return (
    <Card
      ref={ref}
      className={cn(
        'w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 relative border-8',
        frameImageUrl ? 'border-transparent text-white' : 'text-card-foreground',
        {
          'border-amber-900/50 bg-stone-200 text-stone-800': theme === 'fantasy' && !frameImageUrl,
          'border-cyan-400/50 bg-slate-900 text-slate-100 shadow-[0_0_20px_theme(colors.cyan.500/0.5)]': theme === 'sci-fi' && !frameImageUrl,
          'border-slate-300 bg-white text-slate-900': theme === 'modern' && !frameImageUrl,
        }
      )}
      style={cardStyle}
      data-theme={theme}
    >
      <div className={cn(
        'absolute inset-0 z-0',
        frameImageUrl && 'bg-black/40',
      )}></div>
      <div className="relative z-10 flex flex-col h-full">
        <CardHeader className={cn(
          'flex-row items-center justify-between p-3',
           frameImageUrl && 'bg-transparent'
        )}>
          <CardTitle className={cn(
              "text-lg font-bold",
              frameImageUrl && 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]',
          )}>
            {name}
          </CardTitle>
          <div className={cn(
            'flex items-center justify-center gap-1 font-bold text-lg h-8 w-8 rounded-full border-2',
            {
              'bg-blue-200 text-blue-900 border-blue-400': theme === 'fantasy' && !frameImageUrl,
              'bg-fuchsia-900/80 text-fuchsia-200 border-fuchsia-500 shadow-inner': theme === 'sci-fi' && !frameImageUrl,
              'bg-slate-700 text-white border-slate-500': theme === 'modern' && !frameImageUrl,
              'bg-black/30 border-white/50 text-white': frameImageUrl
            }
          )}>
            <span>{manaCost}</span>
            <Sparkles className="h-4 w-4 fill-current" />
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-grow">
          <div className="relative aspect-[4/3] w-full bg-gray-400 mx-auto max-w-[calc(100%-1.5rem)] rounded-md overflow-hidden border-2 border-black/50">
            {isImageGenerating ? (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground"/>
                </div>
            ) : (
                <Image src={imageUrl} alt={imageHint} width={400} height={300} style={{objectFit: 'cover'}} data-ai-hint={imageHint} 
                className={cn('w-full h-auto', {'sepia-[25%]': theme === 'fantasy' && !frameImageUrl})}
                unoptimized
                priority
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
          </div>

          <div className="p-3 space-y-3 text-sm">
            <div className={cn(
              'flex justify-between items-center px-2 py-1 rounded-sm',
              frameImageUrl ? 'bg-black/30' : 'bg-card-foreground/10'
            )}>
              <p className="font-semibold capitalize">
                {cardTypeJapanese[cardType]}
                {creatureType && creatureType !== 'none' && ` - ${creatureTypeJapanese[creatureType]}`}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase">{rarityJapanese[rarity]}</span>
                <Gem className="h-3 w-3" style={{ color: rarityColorVar[rarity] }} />
              </div>
            </div>

            <div className={cn(
              'p-3 rounded-md min-h-[70px] border',
              frameImageUrl ? 'bg-black/30 border-white/20' : 'bg-card-foreground/5 border-card-foreground/20'
            )}>
              <p className="whitespace-pre-wrap">{abilities}</p>
            </div>

            {flavorText && (
              <div className="px-1">
                <Separator className={cn(frameImageUrl ? 'bg-white/30' : 'bg-border')} />
                <p className={cn('italic pt-2', frameImageUrl ? 'text-white/80' : 'text-muted-foreground')}>
                  {flavorText}
                </p>
              </div>
            )}
          </div>
        </CardContent>

        {showStats && (
          <CardFooter className={cn(
            'flex justify-end p-3 gap-3 mt-auto',
            frameImageUrl && 'bg-transparent'
          )}>
            <div className="flex items-center justify-center gap-1.5 font-bold text-base h-8 w-12 rounded bg-red-600/90 text-white border border-red-400 shadow-md">
              <span>{attack}</span>
              <Swords className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-center gap-1.5 font-bold text-base h-8 w-12 rounded bg-sky-600/90 text-white border border-sky-400 shadow-md">
              <span>{defense}</span>
              <Shield className="h-4 w-4" />
            </div>
          </CardFooter>
        )}
      </div>
    </Card>
  );
});

CardPreview.displayName = "CardPreview";
