
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
import { useState, useTransition, useCallback, useMemo } from 'react';
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
  frameImageUrl?: string;
  canAttack?: boolean;
}

interface CardEditorProps {
  cardData: CardData;
  setCardData: React.Dispatch<React.SetStateAction<CardData>>;
  cardPreviewRef: React.RefObject<HTMLDivElement>;
}

export function CardEditor({ cardData, setCardData, cardPreviewRef }: CardEditorProps) {
  const [isIdeaPending, startIdeaTransition] = useTransition();
  const [isImagePending, startImageTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const [aiTheme, setAiTheme] = useState('パワフルな神秘のドラゴン');
  const { toast } = useToast();
  const { currency, spendCurrency } = useCurrency();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: name === 'manaCost' || name === 'attack' || name === 'defense' ? Number(value) : value }));
  };

  const handleSelectChange = (name: keyof CardData) => (value: string) => {
    setCardData(prev => ({ ...prev, [name]: value }));
  };

  const handleThemeChange = (value: string) => {
    setCardData(prev => ({ ...prev, theme: value as Theme, frameImageUrl: undefined }));
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
                imageHint: file.name, // Use file name as a hint
            }));
            toast({
                title: '画像がアップロードされました',
            });
        };
        reader.readAsDataURL(file);
    }
  };
  
  const handleCardBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            const cardBackUrl = event.target?.result as string;
            try {
                localStorage.setItem('cardBackImage', cardBackUrl);
                toast({
                    title: 'カード裏面の画像が保存されました',
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
        reader.readAsDataURL(file);
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
    startImageTransition(async () => {
        try {
            const result = await generateImage({ prompt: cardData.imageHint });
            setCardData(prev => ({
                ...prev,
                imageUrl: result.imageUrl,
            }));
            toast({
                title: '画像が生成されました！',
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: '画像の生成に失敗しました',
                description: '時間をおいて再度お試しください。',
            });
        }
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
    // Name: 1G per character
    cost += cardData.name.length;
    // Card Type: 5G for creature, 10G for artifact
    if (cardData.cardType === 'creature') cost += 5;
    if (cardData.cardType === 'artifact') cost += 10;
    // Abilities: 5G per 3 characters
    cost += Math.ceil(cardData.abilities.length / 3) * 5;
    return cost;
  }, [cardData.name, cardData.cardType, cardData.abilities]);

  const handleSaveToCollection = () => {
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
      const collection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
      const newCard = { ...cardData, id: self.crypto.randomUUID() };
      const newCollection = [...collection, newCard];
      localStorage.setItem('cardCollection', JSON.stringify(newCollection));
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
                <Button onClick={handleGenerateImage} disabled={isImagePending} className="w-full">
                    {isImagePending ? <Loader2 className="animate-spin" /> : <Sparkles />}
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
            <RadioGroup value={cardData.frameImageUrl ? 'custom' : cardData.theme} onValueChange={handleThemeChange} className="grid grid-cols-3 gap-4">
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
            <Label htmlFor="card-back-upload" className="w-full">
                <Button asChild variant="outline" className="w-full cursor-pointer">
                    <div>
                        <Upload className="mr-2" />
                        カード裏面をアップロード
                    </div>
                </Button>
                <Input id="card-back-upload" type="file" className="sr-only" accept="image/*" onChange={handleCardBackUpload} />
            </Label>
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
