'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from '@/hooks/use-toast';
import { shopItems, type ShopItem } from '@/lib/shop-items';
import Image from 'next/image';
import { Coins, CheckCircle } from 'lucide-react';
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

type ItemCategory = 'frames' | 'backs' | 'artifacts' | 'animations';

type PurchasedItems = Record<ItemCategory, Set<string>>;

const ShopCategory = ({ category, title, purchasedItems, currency, handlePurchase }: { 
    category: ItemCategory, 
    title: string, 
    purchasedItems: PurchasedItems,
    currency: number,
    handlePurchase: (item: ShopItem, category: ItemCategory) => void 
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(shopItems[category]).map(item => (
                <Card key={item.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{item.name}</CardTitle>
                        {item.description && <CardDescription>{item.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-center items-center">
                        <div className="relative w-full h-40 mb-4">
                            <Image src={item.url} alt={item.name} layout="fill" className="rounded-md object-contain" unoptimized/>
                        </div>
                        <div className="text-lg font-bold flex items-center gap-2 text-yellow-500">
                            <Coins className="h-5 w-5"/>
                            <span>{item.price.toLocaleString()} G</span>
                        </div>
                    </CardContent>
                    <div className="p-4 border-t">
                        {purchasedItems[category]?.has(item.id) ? (
                            <Button disabled className="w-full">
                                <CheckCircle className="mr-2" />
                                購入済み
                            </Button>
                        ) : (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="w-full" disabled={currency < item.price}>購入する</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>購入確認</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            「{item.name}」を {item.price.toLocaleString()}G で購入します。よろしいですか？
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handlePurchase(item, category)}>購入</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default function ShopPage() {
    const { currency, spendCurrency } = useCurrency();
    const { toast } = useToast();
    
    const [purchasedItems, setPurchasedItems] = useState<PurchasedItems>({
        frames: new Set(['frame-default']),
        backs: new Set(['back-default']),
        artifacts: new Set(),
        animations: new Set(['anim-flip']),
    });

    useEffect(() => {
        try {
            const savedFrames = new Set(JSON.parse(localStorage.getItem('purchasedCardFrames') || '["frame-default"]') as string[]);
            const savedBacks = new Set(JSON.parse(localStorage.getItem('purchasedCardBacks') || '["back-default"]') as string[]);
            const savedArtifacts = new Set(JSON.parse(localStorage.getItem('purchasedArtifacts') || '[]') as string[]);
            const savedAnimations = new Set(JSON.parse(localStorage.getItem('purchasedAnimations') || '["anim-flip"]') as string[]);

            setPurchasedItems({
                frames: savedFrames,
                backs: savedBacks,
                artifacts: savedArtifacts,
                animations: savedAnimations,
            });
        } catch (e) {
            console.error("Failed to load purchased items", e);
        }
    }, []);

    const handlePurchase = (item: ShopItem, category: ItemCategory) => {
        if (currency < item.price) {
            toast({ variant: 'destructive', title: 'Gコインが足りません！' });
            return;
        }

        if (!spendCurrency(item.price)) {
             toast({ variant: 'destructive', title: '購入に失敗しました。' });
             return;
        }

        const newPurchased = new Set(purchasedItems[category]);
        newPurchased.add(item.id);

        const updatedItems = { ...purchasedItems, [category]: newPurchased };
        setPurchasedItems(updatedItems);

        try {
           if (category === 'frames') localStorage.setItem('purchasedCardFrames', JSON.stringify(Array.from(newPurchased)));
           if (category === 'backs') localStorage.setItem('purchasedCardBacks', JSON.stringify(Array.from(newPurchased)));
           if (category === 'artifacts') localStorage.setItem('purchasedArtifacts', JSON.stringify(Array.from(newPurchased)));
           if (category === 'animations') localStorage.setItem('purchasedAnimations', JSON.stringify(Array.from(newPurchased)));

        } catch (e) {
            console.error("Failed to save purchase", e);
        }

        toast({
            title: '購入しました！',
            description: `「${item.name}」を購入しました。`,
        });
    };

    const commonShopCategoryProps = {
        purchasedItems,
        currency,
        handlePurchase,
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">ショップ</h1>
            <p className="text-muted-foreground mb-6">Gコインを使って、新しいカスタマイズアイテムや便利な道具を手に入れよう。</p>
            
            <Tabs defaultValue="frames" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="frames">カード表面</TabsTrigger>
                    <TabsTrigger value="backs">カード裏面</TabsTrigger>
                    <TabsTrigger value="artifacts">アーティファクト</TabsTrigger>
                    <TabsTrigger value="animations">演出</TabsTrigger>
                </TabsList>
                <TabsContent value="frames"><ShopCategory category="frames" title="カード表面" {...commonShopCategoryProps} /></TabsContent>
                <TabsContent value="backs"><ShopCategory category="backs" title="カード裏面" {...commonShopCategoryProps} /></TabsContent>
                <TabsContent value="artifacts"><ShopCategory category="artifacts" title="アーティファクト" {...commonShopCategoryProps} /></TabsContent>
                <TabsContent value="animations"><ShopCategory category="animations" title="演出" {...commonShopCategoryProps} /></TabsContent>
            </Tabs>
        </div>
    );
}
