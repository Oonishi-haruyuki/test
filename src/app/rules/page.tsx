
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Swords, Shield, Sparkles, BookOpen, Star, Hand, Layers } from "lucide-react";

export default function RulesPage() {
    return (
        <main className="container mx-auto">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl">ゲームのルール</CardTitle>
                    <CardDescription>カードクラフターの基本的な遊び方を学びましょう。</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-lg"><Star className="text-primary" />ゲームの目的</div>
                            </AccordionTrigger>
                            <AccordionContent className="text-base leading-relaxed pl-8">
                                このゲームの目的は、対戦相手のライフを20点から0点にすることです。先に相手のライフを0にしたプレイヤーが勝者となります。
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-lg"><BookOpen className="text-primary" />ゲームの準備</div>
                            </AccordionTrigger>
                            <AccordionContent className="text-base leading-relaxed pl-8 space-y-2">
                                <p><strong>デッキ:</strong> 30枚のカードで構築します。「デッキ構築」ページで、集めたカードを使って自分だけのデッキを作成できます。</p>
                                <p><strong>ライフ:</strong> 各プレイヤーは20点のライフからゲームを開始します。</p>
                                <p><strong>手札:</strong> ゲーム開始時、各プレイヤーは自分のデッキからカードを5枚引きます。これが最初の手札となります。</p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-lg"><Sparkles className="text-primary" />マナについて</div>
                            </AccordionTrigger>
                            <AccordionContent className="text-base leading-relaxed pl-8">
                                カードを使用するためには「マナ」が必要です。あなたのターンが始まるたびに、使用できるマナの最大値が1ずつ増え（最大10マナ）、現在マナは最大値まで回復します。カードの左上に書かれている数字が、そのカードを使用するために必要なマナコストです。
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-lg"><Layers className="text-primary" />カードの種類</div>
                            </AccordionTrigger>
                            <AccordionContent className="text-base leading-relaxed pl-8 space-y-4">
                                <div>
                                    <h4 className="font-semibold flex items-center gap-1"><Swords />クリーチャーカード</h4>
                                    <p className="pl-5">場に出して戦うモンスターや兵士です。攻撃力と防御力を持ち、相手プレイヤーや相手クリーチャーに攻撃できます。場が埋まっている（上限5体）と新しいクリーチャーは出せません。</p>
                                </div>
                                 <div>
                                    <h4 className="font-semibold flex items-center gap-1">呪文カード</h4>
                                    <p className="pl-5">使うと即座に様々な効果を発揮するカードです。ダメージを与えたり、カードを引いたり、クリーチャーを強化したりします。一度使うと墓地に送られます。</p>
                                </div>
                                 <div>
                                    <h4 className="font-semibold flex items-center gap-1">アーティファクトカード</h4>
                                    <p className="pl-5">場に残り続け、持続的な効果をもたらす魔法の道具や装置です。</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-5">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-lg"><Hand className="text-primary" />ターンの流れ</div>
                            </AccordionTrigger>
                            <AccordionContent className="text-base leading-relaxed pl-8 space-y-4">
                                <p>自分のターンは、以下のフェイズで進行します。</p>
                                <div>
                                    <h4 className="font-semibold">1. ターン開始</h4>
                                    <p className="pl-5">最大マナが1増え、マナが全回復します。その後、デッキからカードを1枚引きます。</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold">2. メインフェイズ</h4>
                                    <p className="pl-5">手札からカードをプレイできます。クリーチャーは場に出したターンには攻撃できません（「速攻」能力を持つ一部のクリーチャーを除く）。</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold">3. 攻撃フェイズ</h4>
                                    <p className="pl-5">「攻撃フェイズへ」ボタンを押すと、攻撃可能な状態のあなたのクリーチャーがすべて相手プレイヤーに攻撃します。</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold">4. ターン終了</h4>
                                    <p className="pl-5">攻撃が終わると自動的にターンが終了し、相手のターンに変わります。</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                         <AccordionItem value="item-6">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-lg"><Shield className="text-primary" />勝利と敗北</div>
                            </AccordionTrigger>
                            <AccordionContent className="text-base leading-relaxed pl-8 space-y-2">
                               <p><strong>勝利条件:</strong> 相手のライフを0にする。</p>
                               <p><strong>敗北条件:</strong> 自分のライフが0になる。</p>
                               <p>デッキのカードが0枚の状態でカードを引こうとすると、ペナルティとしてダメージを受け、ゲームに敗北することもあります。</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </main>
    );
}
