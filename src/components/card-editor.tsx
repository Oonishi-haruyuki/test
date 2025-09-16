
'use client';

import { generateCardIdeas, type GenerateCardIdeasOutput } from '@/ai/flows/generate-card-ideas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Save, Wand2 } from 'lucide-react';
import type React from 'react';
import { useState, useTransition } from 'react';

// Type definitions
export type Theme = 'fantasy' | 'sci-fi' | 'modern';
export type CardType = 'creature' | 'spell' | 'artifact' | 'land';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic';

export interface CardData {
  id?: string; // Add optional id for collection management
  theme: Theme;
  name: string;
  manaCost: number;
  attack: number;
  defense: number;
  cardType: CardType;
  rarity: Rarity;
  abilities: string;
  flavorText: string;
  imageUrl: string;
  imageHint: string;
}

interface CardEditorProps {
  cardData: CardData;
  setCardData: React.Dispatch<React.SetStateAction<CardData>>;
}

export function CardEditor({ cardData, setCardData }: CardEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [aiTheme, setAiTheme] = useState('パワフルな神秘のドラゴン');
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: name === 'manaCost' || name === 'attack' || name === 'defense' ? Number(value) : value }));
  };

  const handleSelectChange = (name: keyof CardData) => (value: string) => {
    setCardData(prev => ({ ...prev, [name]: value }));
  };

  const handleThemeChange = (value: string) => {
    setCardData(prev => ({ ...prev, theme: value as Theme }));
  };

  const handleGenerate = async () => {
    if (!aiTheme.trim()) {
        toast({
            variant: 'destructive',
            title: 'テーマが空です',
            description: 'カードを生成するためのテーマやプロンプトを入力してください。',
        });
        return;
    }
    startTransition(async () => {
      try {
        const result: GenerateCardIdeasOutput = await generateCardIdeas({ theme: aiTheme });
        setCardData(prev => ({
          ...prev,
          name: result.cardName,
          abilities: result.abilities.replace(/\\n/g, '\n'),
          flavorText: result.flavorText,
        }));
        toast({
          title: 'カードのアイデアが生成されました！',
          description: `「${result.cardName}」が作成されました。`,
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: '生成に失敗しました',
          description: 'カードのアイデアを生成できませんでした。もう一度お試しください。',
        });
      }
    });
  };

  const handleSaveToCollection = () => {
    try {
      const collection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
      const newCard = { ...cardData, id: self.crypto.randomUUID() };
      const newCollection = [...collection, newCard];
      localStorage.setItem('cardCollection', JSON.stringify(newCollection));
      toast({
        title: 'コレクションに保存しました',
        description: `「${newCard.name}」をマイカードに追加しました。`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: '保存に失敗しました',
        description: 'カードをコレクションに保存できませんでした。',
      });
    }
  };


  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. AIで生成</CardTitle>
            <CardDescription>テーマを説明して、AIにカードを作成させましょう。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="ai-theme">テーマまたはプロンプト</Label>
              <Input
                id="ai-theme"
                placeholder="例：未来のサイボーグ忍者"
                value={aiTheme}
                onChange={e => setAiTheme(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerate} disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
              アイデアを生成
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. カードをカスタマイズ</CardTitle>
            <CardDescription>カードの細部を調整します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">カード名</Label>
              <Input id="name" name="name" value={cardData.name} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manaCost">マナ</Label>
                <Input id="manaCost" name="manaCost" type="number" value={cardData.manaCost} onChange={handleInputChange} min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attack">攻撃力</Label>
                <Input id="attack" name="attack" type="number" value={cardData.attack} onChange={handleInputChange} min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defense">防御力</Label>
                <Input id="defense" name="defense" type="number" value={cardData.defense} onChange={handleInputChange} min="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>カードタイプ</Label>
                <Select name="cardType" value={cardData.cardType} onValueChange={handleSelectChange('cardType')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="creature">クリーチャー</SelectItem>
                    <SelectItem value="spell">呪文</SelectItem>
                    <SelectItem value="artifact">アーティファクト</SelectItem>
                    <SelectItem value="land">土地</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>レアリティ</Label>
                <Select name="rarity" value={cardData.rarity} onValueChange={handleSelectChange('rarity')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">コモン</SelectItem>
                    <SelectItem value="uncommon">アンコモン</SelectItem>
                    <SelectItem value="rare">レア</SelectItem>
                    <SelectItem value="mythic">神話レア</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="abilities">能力</Label>
              <Textarea id="abilities" name="abilities" value={cardData.abilities} onChange={handleInputChange} rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flavorText">フレーバーテキスト</Label>
              <Textarea id="flavorText" name="flavorText" value={cardData.flavorText} onChange={handleInputChange} rows={2} />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveToCollection} className="w-full">
                <Save className="mr-2" />
                コレクションに追加
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. ビジュアルテーマ</CardTitle>
            <CardDescription>カードのビジュアルスタイルを選択します。</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={cardData.theme} onValueChange={handleThemeChange} className="grid grid-cols-3 gap-4">
              <div>
                <RadioGroupItem value="fantasy" id="fantasy" className="peer sr-only" />
                <Label htmlFor="fantasy" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  ファンタジー
                </Label>
              </div>
              <div>
                <RadioGroupItem value="sci-fi" id="sci-fi" className="peer sr-only" />
                <Label htmlFor="sci-fi" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  SF
                </Label>
              </div>
              <div>
                <RadioGroupItem value="modern" id="modern" className="peer sr-only" />
                <Label htmlFor="modern" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  モダン
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. エクスポート</CardTitle>
            <CardDescription>完成したカードデザインをダウンロードします。</CardDescription>
          </CardHeader>
          <CardContent>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="w-full" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  PNGとしてダウンロード
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>エクスポート機能は近日公開予定です！</p>
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
