'use client';

import { generateCardIdeas, type GenerateCardIdeasOutput } from '@/ai/flows/generate-card-ideas';
import { generateImage } from '@/ai/flows/generate-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Save, Wand2, Upload, Sparkles, Coins } from 'lucide-react';
import type React from 'react';
import { useState, useTransition, useCallback, useMemo, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { useCurrency } from '@/hooks/use-currency';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { shopItems } from '@/lib/shop-items';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useMissions } from '@/hooks/use-missions';
import { useAuth } from '@/components/auth-provider';
import { appendUserCard } from '@/lib/user-data-store';


export type Theme = 'fantasy' | 'sci-fi' | 'modern' | 'custom';
export type CardType = 'creature' | 'spell' | 'artifact' | 'land';
export type CreatureType = 'none' | 'human' | 'elf' | 'dwarf' | 'goblin' | 'orc' | 'undead' | 'dragon' | 'beast' | 'elemental' | 'soldier' | 'wizard' | 'spirit' | 'angel' | 'demon' | 'machine';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic';

export type CardSchema = {
  name: string;
  manaCost: number;
  attack: number;
  defense: number;
  cardType: CardType;
  creatureType?: CreatureType;
  rarity: Rarity;
  abilities: string;
  flavorText: string;
  imageHint: string;
};

export interface CardData extends CardSchema {
  id?: string;
  theme: Theme;
  imageUrl: string;
  frameImageUrl?: string;
  canAttack?: boolean;
}

interface CardEditorProps {
  cardData: CardData;
  setCardData: React.Dispatch<React.SetStateAction<CardData>>;
  cardPreviewRef: React.RefObject<HTMLDivElement>;
  isImageGenerating: boolean;
  setIsImageGenerating: React.Dispatch<React.SetStateAction<boolean>>;
}

export function CardEditor({ cardData, setCardData, cardPreviewRef, isImageGenerating, setIsImageGenerating }: CardEditorProps) {
  const { updateMissionProgress } = useMissions();
  const { user } = useAuth();
  const [isIdeaPending, startIdeaTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const [aiTheme, setAiTheme] = useState('パワフルな神秘のドラゴン');
  const { toast } = useToast();
  const { currency, spendCurrency } = useCurrency();

  const [purchasedFrames, setPurchasedFrames] = useState<string[]>(['frame-default']);
  const [purchasedBacks, setPurchasedBacks] = useState<string[]>(['back-default']);
  const [currentBack, setCurrentBack] = useState<string>('back-default');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const defaultBack = shopItems.backs.find(b => b.id === 'back-default');
    try {
        const savedFrames = JSON.parse(localStorage.getItem('purchasedCardFrames') || '["frame-default"]');
        const savedBacks = JSON.parse(localStorage.getItem('purchasedCardBacks') || '["back-default"]');
        setPurchasedFrames(savedFrames);
        setPurchasedBacks(savedBacks);
        const savedBackImage = localStorage.getItem('cardBackImage') || defaultBack?.url;
        const backId = shopItems.backs.find(b => b.url === savedBackImage)?.id || 'back-default';
        setCurrentBack(backId);
    } catch (e) {
        console.error("Failed to load purchased items", e);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: name === 'manaCost' || name === 'attack' || name === 'defense' ? Number(value) : value }));
  };

  const handleSelectChange = (name: keyof CardData) => (value: string) => {
    setCardData(prev => ({ ...prev, [name]: value }));
  };

  const handleThemeChange = (value: string) => {
    const selectedFrame = shopItems.frames.find(frame => frame.id === value);
    if (selectedFrame) {
      setCardData(prev => ({ ...prev, theme: 'custom', frameImageUrl: selectedFrame.url }));
    } else {
      setCardData(prev => ({ ...prev, theme: value as Theme, frameImageUrl: undefined }));
    }
  };
  
  const handleFrameImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            toast({
                variant: 'destructive',
                title: '無効なファイルタイプ',
                description: '画像ファイル（JPEG, PNG, GIFなど）を選択してください。',
            });
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const frameImageUrl = event.target?.result as string;
            setCardData(prev => ({
                ...prev,
                theme: 'custom',
                frameImageUrl: frameImageUrl,
            }));
            toast({
                title: 'カードフレーム画像がアップロードされました',
            });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            toast({
                variant: 'destructive',
                title: '無効なファイルタイプ',
                description: '画像ファイル（JPEG, PNG, GIFなど）を選択してください。',
            });
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            setCardData(prev => ({
                ...prev,
                imageUrl: imageUrl,
                imageHint: file.name,
            }));
            toast({
                title: '画像がアップロードされました',
            });
        };
        reader.readAsDataURL(file);
    }
  };
  
  const handleCardBackSelect = (cardBackId: string) => {
    const cardBack = shopItems.backs.find(b => b.id === cardBackId);
    if (!cardBack) return;

    try {
        localStorage.setItem('cardBackImage', cardBack.url);
        setCurrentBack(cardBackId);
        toast({
            title: 'カード裏面の画像を変更しました',
            description: `「${cardBack.name}」が設定されました。`,
        });
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: '保存に失敗しました',
            description: 'カード裏面を保存できませんでした。',
        });
    }
};

  const handleGenerateImage = () => {
    if (!cardData.imageHint) {
        toast({
            variant: 'destructive',
            title: '画像ヒントがありません',
            description: '画像のヒントを入力してください。',
        });
        return;
    }
    setIsImageGenerating(true);
    generateImage({ prompt: cardData.imageHint })
        .then(result => {
            setCardData(prev => ({
                ...prev,
                imageUrl: result.imageUrl,
            }));
            toast({
                title: '画像が生成されました！',
            });
        })
        .catch(error => {
            console.error(error);
            toast({
                variant: 'destructive',
                title: '画像の生成に失敗しました',
                description: '時間をおいて再度お試しください。',
            });
        })
        .finally(() => {
            setIsImageGenerating(false);
        });
  };

  const handleGenerateIdeas = async () => {
    if (!aiTheme.trim()) {
        toast({
            variant: 'destructive',
            title: 'テーマが空です',
            description: 'カードを生成するためのテーマやプロンプトを入力してください。',
        });
        return;
    }
    startIdeaTransition(async () => {
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

  const creationCost = useMemo(() => {
    let cost = 0;
    cost += cardData.name.length;
    if (cardData.cardType === 'creature') cost += 5;
    if (cardData.cardType === 'artifact') cost += 10;
    cost += Math.ceil(cardData.abilities.length / 3) * 5;
    return cost;
  }, [cardData.name, cardData.cardType, cardData.abilities]);

  const handleSaveToCollection = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'サインインが必要です',
        description: 'カード保存にはサインインが必要です。',
      });
      return;
    }

    if (currency < creationCost) {
        toast({
            variant: 'destructive',
            title: 'Gコインが足りません！',
            description: `このカードの作成には ${creationCost}G が必要ですが、${currency}G しかありません。`,
        });
        return;
    }

    if (!spendCurrency(creationCost)) {
        toast({
            variant: 'destructive',
            title: 'Gコインの支払いに失敗しました。',
        });
        return;
    }

    try {
      const newCard = { ...cardData, id: self.crypto.randomUUID() };
      await appendUserCard(user.uid, newCard);
      updateMissionProgress('create-cards', 1);
      toast({
        title: 'コレクションに保存しました',
        description: `「${newCard.name}」をマイカードに追加しました。 (${creationCost}G 消費)`,
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

  const handleExport = useCallback(() => {
    if (cardPreviewRef.current === null) {
      return;
    }
    setIsExporting(true);

    toPng(cardPreviewRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${cardData.name.replace(/\s+/g, '_').toLowerCase()}.png`;
        link.href = dataUrl;
        link.click();
        toast({
            title: 'ダウンロードを開始しました',
            description: 'カード画像をPNGとして保存します。',
          });
      })
      .catch((err) => {
        console.error(err);
        toast({
            variant: 'destructive',
            title: 'エクスポートに失敗しました',
            description: '画像の生成中にエラーが発生しました。',
        });
      })
      .finally(() => {
        setIsExporting(false);
      });
  }, [cardPreviewRef, cardData.name, toast]);

  const availableFrames = shopItems.frames.filter(frame => purchasedFrames.includes(frame.id) || frame.price === 0);
  const availableBacks = shopItems.backs.filter(back => purchasedBacks.includes(back.id) || back.price === 0);
  
  return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. AIでアイデアを作成</CardTitle>
            <CardDescription>テーマやプロンプトを基に、カードのテキストを生成します。</CardDescription>
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
            <Button onClick={handleGenerateIdeas} disabled={isIdeaPending} className="w-full">
              {isIdeaPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
              テキストを生成
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. カードをカスタマイズ</CardTitle>
            <CardDescription>AIが生成した、またはあなた自身で考えたカードの細部を調整します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">カード名</Label>
              <Input id="name" name="name" value={cardData.name} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manaCost">マナ</Label>
                <Input id="manaCost" name="manaCost" type="number" value={cardData.manaCost} onChange={handleInputChange} min="0" max="10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attack">攻撃力</Label>
                <Input id="attack" name="attack" type="number" value={cardData.attack} onChange={handleInputChange} min="0" max="12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defense">防御力</Label>
                <Input id="defense" name="defense" type="number" value={cardData.defense} onChange={handleInputChange} min="0" max="12" />
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
               {cardData.cardType === 'creature' && (
                <div className="space-y-2">
                    <Label>クリーチャー種族</Label>
                    <Select name="creatureType" value={cardData.creatureType || 'none'} onValueChange={handleSelectChange('creatureType')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">なし</SelectItem>
                            <SelectItem value="human">ヒューマン</SelectItem>
                            <SelectItem value="elf">エルフ</SelectItem>
                            <SelectItem value="dwarf">ドワーフ</SelectItem>
                            <SelectItem value="goblin">ゴブリン</SelectItem>
                            <SelectItem value="orc">オーク</SelectItem>
                            <SelectItem value="undead">アンデッド</SelectItem>
                            <SelectItem value="dragon">ドラゴン</SelectItem>
                            <SelectItem value="beast">ビースト</SelectItem>
                            <SelectItem value="elemental">エレメンタル</SelectItem>
                            <SelectItem value="soldier">ソルジャー</SelectItem>
                            <SelectItem value="wizard">ウィザード</SelectItem>
                            <SelectItem value="spirit">スピリット</SelectItem>
                            <SelectItem value="angel">天使</SelectItem>
                            <SelectItem value="demon">悪魔</SelectItem>
                            <SelectItem value="machine">機械</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
               )}
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
              <Textarea id="abilities" name="abilities" value={cardData.abilities} onChange={handleInputChange} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flavorText">フレーバーテキスト</Label>
              <Textarea id="flavorText" name="flavorText" value={cardData.flavorText} onChange={handleInputChange} rows={2} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>3. 画像を用意</CardTitle>
                <CardDescription>AIで生成するか、手持ちの画像をアップロードします。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="imageHint">画像生成のヒント (英語)</Label>
                    <Input id="imageHint" name="imageHint" value={cardData.imageHint} onChange={handleInputChange} placeholder="例: epic dragon, magic forest" />
                </div>
                <Button onClick={handleGenerateImage} disabled={isImageGenerating} className="w-full">
                    {isImageGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    AIで画像を生成
                </Button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">または</span>
                    </div>
                </div>
                <Label htmlFor="image-upload" className="w-full">
                    <Button asChild variant="outline" className="w-full cursor-pointer">
                        <div>
                            <Upload className="mr-2" />
                            画像をアップロード
                        </div>
                    </Button>
                    <Input id="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                </Label>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. ビジュアルテーマ</CardTitle>
            <CardDescription>カードのビジュアルスタイルを選択またはアップロードします。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={cardData.frameImageUrl ? shopItems.frames.find(f => f.url === cardData.frameImageUrl)?.id : cardData.theme} onValueChange={handleThemeChange} className="grid grid-cols-3 gap-4">
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
              {availableFrames.map(frame => (
                <div key={frame.id}>
                    <RadioGroupItem value={frame.id} id={frame.id} className="peer sr-only" />
                    <Label htmlFor={frame.id} className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                       <Image src={frame.url} alt={frame.name} width={50} height={70} className="w-full h-auto rounded-sm mb-2" unoptimized />
                       <span className="text-xs text-center">{frame.name}</span>
                    </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">または</span>
                </div>
            </div>
             <Label htmlFor="frame-image-upload" className="w-full">
                <Button asChild variant="outline" className="w-full cursor-pointer">
                    <div>
                        <Upload className="mr-2" />
                        カード表面をアップロード
                    </div>
                </Button>
                <Input id="frame-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFrameImageUpload} />
            </Label>
            <Separator />
            <Label>カード裏面のデザイン</Label>
            <RadioGroup onValueChange={handleCardBackSelect} value={currentBack} className="grid grid-cols-3 gap-4">
                {isClient && availableBacks.map(back => (
                    <div key={back.id}>
                         <RadioGroupItem value={back.id} id={`back-${back.id}`} className="peer sr-only" />
                         <Label htmlFor={`back-${back.id}`} className={cn("rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary")}>
                           <Image src={back.url} alt={back.name} width={100} height={140} className="w-full h-auto rounded-sm" unoptimized />
                           <p className="text-xs text-center mt-1">{back.name}</p>
                        </Label>
                    </div>
                ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. 保存とエクスポート</CardTitle>
            <CardDescription>完成したカードを保存またはダウンロードします。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button className="w-full" disabled={!cardData.name}>
                        <Save className="mr-2" />
                        コレクションに追加
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>カード作成の確認</AlertDialogTitle>
                        <AlertDialogDescription>
                            このカードを作成するには <span className="font-bold text-primary">{creationCost}G</span> が必要です。よろしいですか？
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSaveToCollection}>作成する</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleExport} variant="outline" className="w-full" disabled={isExporting}>
                {isExporting ? <Loader2 className="animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                PNGとしてダウンロード
            </Button>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500"/>
                現在の作成コスト: {creationCost}G
            </p>
          </CardFooter>
        </Card>
      </div>
  );
}
