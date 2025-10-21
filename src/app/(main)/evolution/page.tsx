'use client';

import { useState, useEffect, useMemo } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useInventory } from '@/hooks/use-inventory';

// Example evolution data
const evolutionRecipes: { [key: string]: { materialId: string; materialAmount: number; successRate: number; result: Partial<CardData> } } = {
    'starter-dragon-3': { // Young Dragon
        materialId: 'dragon-soul',
        materialAmount: 1,
        successRate: 0.5,
        result: {
            name: '成熟したドラゴン',
            manaCost: 5,
            attack: 5,
            defense: 5,
            abilities: '飛行、速攻、戦場に出たとき2ダメージを任意の対象に与える。',
            rarity: 'rare',
        },
    },
     'starter-gob-3': { // Goblin Captain
        materialId: 'dragon-soul',
        materialAmount: 1,
        successRate: 0.3,
        result: {
            name: 'ゴブリンの竜騎士',
            manaCost: 4,
            attack: 4,
            defense: 4,
            abilities: '他のゴブリンは+1/+1の修正を受ける。飛行',
            rarity: 'rare',
        },
    }
};

export default function EvolutionPage() {
    const [collection, setCollection] = useState<CardData[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [isEvolving, setIsEvolving] = useState(false);
    const { toast } = useToast();
    const { inventory, removeItem } = useInventory();

    useEffect(() => {
        try {
            const savedCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
            setCollection(savedCollection);
        } catch (e) {
            console.error("Failed to load collection", e);
            toast({ variant: "destructive", title: "コレクションの読み込みに失敗しました" });
        }
    }, [toast]);
    
    const evolvableCards = useMemo(() => {
        return collection.filter(card => evolutionRecipes[card.id!]);
    }, [collection]);
    
    const selectedCard = useMemo(() => {
        return collection.find(c => c.id === selectedCardId);
    }, [collection, selectedCardId]);

    const recipe = selectedCardId ? evolutionRecipes[selectedCardId] : null;

    const handleEvolve = () => {
        if (!selectedCard || !recipe) return;

        const hasMaterials = (inventory[recipe.materialId] || 0) >= recipe.materialAmount;

        if (!hasMaterials) {
            toast({ variant: "destructive", title: "素材が足りません！" });
            return;
        }

        setIsEvolving(true);
        // Consume material regardless of success
        if (!removeItem(recipe.materialId, recipe.materialAmount)) {
            toast({ variant: "destructive", title: "素材の消費に失敗しました。" });
            setIsEvolving(false);
            return;
        }
        
        setTimeout(() => {
            if (Math.random() < recipe.successRate) {
                // Success
                const evolvedCard: CardData = {
                    ...selectedCard,
                    ...recipe.result,
                    id: `${selectedCard.id}-evo-${Date.now()}`, // new unique ID
                };

                const newCollection = collection.map(c => c.id === selectedCard.id ? evolvedCard : c);
                localStorage.setItem('cardCollection', JSON.stringify(newCollection));
                setCollection(newCollection);
                setSelectedCardId(evolvedCard.id!);

                toast({
                    title: "進化成功！",
                    description: `「${selectedCard.name}」が「${evolvedCard.name}」に進化しました！`,
                });

            } else {
                // Failure
                toast({
                    variant: "destructive",
                    title: "進化失敗...",
                    description: "素材は失われましたが、カードは無事です。",
                });
            }
            setIsEvolving(false);
        }, 2000); // Simulate evolution time
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-center mb-4">カード進化</h1>
            <p className="text-muted-foreground text-center mb-8">特定の素材を使って、カードをさらに強力な存在へと進化させよう。</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>1. 進化させるカードを選択</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select onValueChange={setSelectedCardId} value={selectedCardId || undefined}>
                            <SelectTrigger>
                                <SelectValue placeholder="進化可能なカードを選択..." />
                            </SelectTrigger>
                            <SelectContent>
                                {evolvableCards.length > 0 ? (
                                    evolvableCards.map(card => (
                                        <SelectItem key={card.id} value={card.id!}>{card.name}</SelectItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">進化可能なカードがコレクションにありません。</div>
                                )}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
                
                <div className="flex flex-col items-center justify-center h-full">
                    {selectedCard && recipe && (
                        <>
                            <Card className="w-full mb-4">
                                <CardHeader>
                                    <CardTitle>2. 必要な素材</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p>{recipe.materialId}: {recipe.materialAmount}個 (所持数: {inventory[recipe.materialId] || 0})</p>
                                    <p>成功率: {recipe.successRate * 100}%</p>
                                </CardContent>
                            </Card>

                            <Button onClick={handleEvolve} disabled={isEvolving || !recipe || (inventory[recipe.materialId] || 0) < recipe.materialAmount}>
                                {isEvolving ? <Loader2 className="animate-spin" /> : '進化させる'}
                            </Button>
                        </>
                    )}
                </div>

                <Card className="md:col-span-1">
                     <CardHeader>
                        <CardTitle>進化結果</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center space-x-4">
                       {selectedCard ? (
                         <>
                            <div className="w-1/2">
                                <p className="text-center text-sm font-semibold mb-2">進化前</p>
                                <CardPreview {...selectedCard} />
                            </div>
                            <ArrowRight className="shrink-0"/>
                            <div className="w-1/2">
                                <p className="text-center text-sm font-semibold mb-2">進化後</p>
                                {recipe ? (
                                    <CardPreview {...{...selectedCard, ...recipe.result}} />
                                ): (
                                     <div className="aspect-[3/4] border-2 border-dashed rounded-2xl flex items-center justify-center text-muted-foreground text-center p-4">
                                        このカードは進化しません
                                    </div>
                                )}
                            </div>
                         </>
                       ) : (
                         <div className="h-64 flex items-center justify-center text-muted-foreground">
                            カードを選択してください
                         </div>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}