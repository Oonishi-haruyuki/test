
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Gem, Shield, Sparkles, Swords } from 'lucide-react';
import Image from 'next/image';
import type { CardData, Rarity, CardType } from './card-editor';
import React from 'react';

const rarityColorVar: Record<Rarity, string> = {
  common: 'hsl(0 0% 63%)', // --muted-foreground
  uncommon: 'hsl(142 71% 45%)', // A nice green
  rare: 'hsl(217 91% 60%)', // A nice blue
  mythic: 'hsl(25 95% 53%)', // A nice orange
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

export const CardPreview = React.forwardRef<HTMLDivElement, CardData>(({
  theme,
  name,
  manaCost,
  attack,
  defense,
  cardType,
  rarity,
  abilities,
  flavorText,
  imageUrl,
  imageHint,
  frameImageUrl,
}, ref) => {
  const showStats = cardType === 'creature';

  const cardStyle = frameImageUrl ? {
    backgroundImage: `url(${frameImageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  return (
    <Card
      ref={ref}
      className={cn(
        'w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 relative',
        frameImageUrl ? 'border-0' : 'border-8',
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
        {'bg-stone-200/80': theme === 'fantasy' && frameImageUrl},
        {'bg-slate-900/80': theme === 'sci-fi' && frameImageUrl},
        {'bg-white/80': theme === 'modern' && frameImageUrl},
      )}></div>
      <div className="relative z-10">
      <CardHeader className={cn(
        'flex-row items-center justify-between p-3',
        {
          'bg-stone-300/80': theme === 'fantasy',
          'bg-slate-800/80': theme === 'sci-fi',
          'bg-slate-100/80': theme === 'modern',
        },
        frameImageUrl && 'bg-transparent'
      )}>
        <CardTitle className={cn(
            "text-lg font-bold",
            {'text-stone-800': theme === 'fantasy'},
            {'text-slate-100': theme === 'sci-fi'},
            {'text-slate-900': theme === 'modern'},
        )}>
          {name}
        </CardTitle>
        <div className={cn(
          'flex items-center justify-center gap-1 font-bold text-lg h-8 w-8 rounded-full',
          {
            'bg-blue-200 text-blue-900 border-2 border-blue-400': theme === 'fantasy',
            'bg-fuchsia-900/80 text-fuchsia-200 border-2 border-fuchsia-500 shadow-inner': theme === 'sci-fi',
            'bg-slate-700 text-white': theme === 'modern',
          }
        )}>
          <span>{manaCost}</span>
          <Sparkles className="h-4 w-4 fill-current" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative aspect-[4/3] w-full bg-gray-400 mx-auto max-w-[calc(100%-1.5rem)] rounded-md overflow-hidden border-2 border-black/50">
          <Image src={imageUrl} alt={imageHint} width={400} height={300} style={{objectFit: 'cover'}} data-ai-hint={imageHint} 
            className={cn('w-full h-auto', {'sepia-[25%]': theme === 'fantasy'})}
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
        </div>

        <div className="p-3 space-y-3 text-sm">
          <div className={cn(
            'flex justify-between items-center px-2 py-1 rounded-sm',
            {'text-stone-800': theme === 'fantasy'},
            {'text-slate-100': theme === 'sci-fi'},
            {'text-slate-900': theme === 'modern'},
            {
              'bg-stone-300/80': theme === 'fantasy',
              'bg-slate-800/80': theme === 'sci-fi',
              'bg-slate-100/80': theme === 'modern',
            },
            frameImageUrl && 'bg-black/20'
          )}>
            <p className="font-semibold capitalize">{cardTypeJapanese[cardType]}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase">{rarityJapanese[rarity]}</span>
              <Gem className="h-3 w-3" style={{ color: rarityColorVar[rarity] }} />
            </div>
          </div>

          <div className={cn(
            'p-3 rounded-md min-h-[70px]',
            {'text-stone-800': theme === 'fantasy'},
            {'text-slate-100': theme === 'sci-fi'},
            {'text-slate-900': theme === 'modern'},
            {
              'bg-stone-100/80 border border-stone-300': theme === 'fantasy',
              'bg-slate-800/50 border border-slate-700 text-slate-200': theme === 'sci-fi',
              'bg-slate-50 border border-slate-200': theme === 'modern',
            },
             frameImageUrl && 'bg-black/20 border-white/20 border'
          )}>
            <p className="whitespace-pre-wrap">{abilities}</p>
          </div>

          {flavorText && (
            <div className="px-1">
              <Separator className={cn(
                'my-2',
                {
                  'bg-stone-300': theme === 'fantasy',
                  'bg-slate-700': theme === 'sci-fi',
                  'bg-slate-200': theme === 'modern',
                },
                 frameImageUrl && 'bg-white/30'
              )} />
              <p className={cn(
                'italic',
                {
                  'text-stone-600': theme === 'fantasy',
                  'text-slate-400': theme === 'sci-fi',
                  'text-slate-500': theme === 'modern',
                },
                frameImageUrl && 'text-white/80'
              )}>
                {flavorText}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      {showStats && (
        <CardFooter className={cn(
          'flex justify-end p-3 gap-3',
          {
            'bg-stone-300/80': theme === 'fantasy',
            'bg-slate-800/80': theme === 'sci-fi',
            'bg-slate-100/80': theme === 'modern',
          },
          frameImageUrl && 'bg-transparent'
        )}>
          <div className="flex items-center justify-center gap-1.5 font-bold text-base h-8 w-12 rounded bg-red-500 text-white">
            <span>{attack}</span>
            <Swords className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-center gap-1.5 font-bold text-base h-8 w-12 rounded bg-sky-500 text-white">
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
