

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from '@/hooks/use-toast';
import { Coins, CheckCircle2 } from 'lucide-react';
import { shopItems, ShopItem } from '@/lib/shop-items';
import Image from 'next/image';
import { useInventory } from '@/hooks/use-inventory';
import { useUser } from '@/firebase';

type ItemType = 'frames' | 'backs' | 'artifacts' | 'animations' | 'materials';

export default function ShopPage() {
    const { user } = useUser();
    const { currency, spendCurrency } = useCurrency();
    const { addItem } = useInventory();
    const { toast } = useToast();
    const [purchasedFrames, setPurchasedFrames] = useState<string[]>([]);
    const [purchasedBacks, setPurchasedBacks] = useState<string[]>([]);
    const [purchasedArtifacts, setPurchasedArtifacts] = useState<string[]>([]);
    const [purchasedAnimations, setPurchasedAnimations] = useState<string[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (user) {
            try {
                const savedFrames = JSON.parse(localStorage.getItem('purchasedCardFrames') || '[]');
                const savedBacks = JSON.parse(localStorage.getItem('purchasedCardBacks') || '[]');
                const savedArtifacts = JSON.parse(localStorage.getItem('purchasedArtifacts') || '[]');
                const savedAnimations = JSON.parse(localStorage.getItem('purchasedGachaAnimations') || '[]');
                setPurchasedFrames(savedFrames);
                setPurchasedBacks(savedBacks);
                setPurchasedArtifacts(savedArtifacts);
                setPurchasedAnimations(savedAnimations);
            } catch (error) {
                console.error("Failed to load purchased items from localStorage", error);
            }
        }
    }, [user]);

    const handlePurchase = (item: ShopItem, type: ItemType) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'ログインが必要です。'});
            return;
        }

        if (currency < item.price) {
            toast({
                variant: 'destructive',
                title: 'Gコインが足りません！',
            });
            return;
        }

        if (!spendCurrency(item.price)) {
            toast({
                variant: 'destructive',
                title: 'Gコインの支払いに失敗しました。',
            });
            return;
        }

        let purchasedItems: string[];
        let storageKey: string;

        if (type === 'materials') {
            addItem(item.id, 1);
            toast({
                title: '購入しました！',
                description: `「${item.name}」を1つ購入しました。`,
            });
            return; // No need to save to a separate 'purchased' list for consumables
        }


        if (type === 'frames') {
            purchasedItems = [...purchasedFrames, item.id];
            setPurchasedFrames(purchasedItems);
            storageKey = 'purchasedCardFrames';
        } else if (type === 'backs') {
            purchasedItems = [...purchasedBacks, item.id];
            setPurchasedBacks(purchasedItems);
            storageKey = 'purchasedCardBacks';
        } else if (type === 'artifacts') {
            purchasedItems = [...purchasedArtifacts, item.id];
            setPurchasedArtifacts(purchasedItems);
            storageKey = 'purchasedArtifacts';
        } else { // animations
            purchasedItems = [...purchasedAnimations, item.id];
            setPurchasedAnimations(purchasedItems);
            storageKey = 'purchasedGachaAnimations';
        }


        try {
            localStorage.setItem(storageKey, JSON.stringify(purchasedItems));
            toast({
                title: '購入しました！',
                description: `「${item.name}」をアンロックしました。`,
            });
        } catch (error) {
            console.error("Failed to save purchase to localStorage", error);
            toast({
                variant: 'destructive',
                title: '購入処理に失敗しました',
            });
            // Rollback currency if save fails (optional)
        }
    };
    
    const renderShopSection = (title: string, items: ShopItem[], purchasedIds: string[] | undefined, type: ItemType) => {
        const isConsumable = type === 'materials';

        return (
            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6">{title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map(item => {
                        const isPurchased = !isConsumable && purchasedIds && purchasedIds.includes(item.id);
                        return (
                            <Card key={item.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{item.name}</CardTitle>
                                    {item.description && <CardDescription>{item.description}</CardDescription>}
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="bg-muted rounded-md aspect-square flex items-center justify-center p-4">
                                        <Image src={item.url} alt={item.name} width={200} height={200} className="w-full h-auto rounded-lg" unoptimized />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col items-stretch gap-2">
                                     {isPurchased ? (
                                        <Button variant="outline" disabled className="w-full">
                                            <CheckCircle2 className="mr-2"/>
                                            購入済み
                                        </Button>
                                     ) : item.price > 0 ? (
                                        <Button onClick={() => handlePurchase(item, type)} disabled={!user || currency < item.price} className="w-full">
                                            <Coins className="mr-2" />
                                            {item.price.toLocaleString()} G で購入
                                        </Button>
                                     ) : (
                                        <Button variant="secondary" disabled className="w-full">
                                            無料
                                        </Button>
                                     )}
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            </section>
        );
    }

    if (!isClient) return null;

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">ショップ</h1>
                <p className="text-muted-foreground">Gコインを使って、新しい見た目や便利なアイテムを手に入れよう！</p>
            </div>
            {renderShopSection('進化素材', shopItems.materials, undefined, 'materials')}
            {renderShopSection('アーティファクト', shopItems.artifacts, purchasedArtifacts, 'artifacts')}
            {renderShopSection('ガチャアニメーション', shopItems.animations, purchasedAnimations, 'animations')}
            {renderShopSection('カードフレーム', shopItems.frames, purchasedFrames, 'frames')}
            {renderShopSection('カード裏面デザイン', shopItems.backs, purchasedBacks, 'backs')}
        </>
    );
}
