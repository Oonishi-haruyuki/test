
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Swords, Shield, Heart, Sparkles, Hand, ScrollText, Bot, Users } from "lucide-react";

export default function RulesPage() {
    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-4xl font-bold text-center mb-4">ゲームルール</h1>
            <p className="text-muted-foreground text-center mb-8">カードクラフターの世界へようこそ！ここで基本ルールを学び、最強を目指そう。</p>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Swords /> ゲームの目的</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>このゲームは、あなたが組んだデッキを使って対戦相手と戦うカードゲームです。先に相手のライフ（初期値: 20）を0にしたプレイヤーの勝利となります。</p>
                </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full space-y-4">
                <Card>
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="p-6">
                            <CardTitle className="flex items-center gap-2 text-left"><ScrollText /> ターンの流れ</CardTitle>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <ul className="list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>**ドローフェイズ:** 自分のターンの開始時に、山札からカードを1枚引きます。</li>
                                <li>**マナリセット:** 自分の最大マナと同じ値まで、現在のマナが回復します。</li>
                                <li>**メインフェイズ:** 手札からカードをプレイしたり、クリーチャーで攻撃したりします。</li>
                                <li>**ターン終了:** 「ターン終了」ボタンを押すと、相手のターンに移ります。</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
                <Card>
                    <AccordionItem value="item-2">
                        <AccordionTrigger className="p-6">
                           <CardTitle className="flex items-center gap-2 text-left"><Sparkles /> マナについて</CardTitle>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                           <p className="text-muted-foreground">マナはカードをプレイするために必要なリソースです。自分のターンが来るたびに最大マナが1ずつ増え（最大10まで）、現在のマナも最大値まで回復します。計画的にマナを使って、強力なカードをプレイしましょう。</p>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
                 <Card>
                    <AccordionItem value="item-3">
                        <AccordionTrigger className="p-6">
                            <CardTitle className="flex items-center gap-2 text-left"><Hand /> カードの種類</CardTitle>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 space-y-4">
                            <div>
                                <h4 className="font-semibold text-lg">クリーチャーカード</h4>
                                <p className="text-muted-foreground">戦場に出して相手を攻撃したり、相手の攻撃をブロックしたりします。攻撃力と防御力（体力）のステータスを持っています。</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-lg">呪文カード</h4>
                                <p className="text-muted-foreground">プレイすると一度だけ効果を発揮し、その後は墓地に送られます。相手にダメージを与えたり、カードを引いたり、様々な効果があります。</p>
                            </div>
                             <div>
                                <h4 className="font-semibold text-lg">アーティファクトカード</h4>
                                <p className="text-muted-foreground">戦場に残り続け、持続的な効果をもたらします。戦況を有利に進める鍵となります。</p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
                <Card>
                    <AccordionItem value="item-4">
                         <AccordionTrigger className="p-6">
                           <CardTitle className="flex items-center gap-2 text-left"><Shield /> 戦闘のルール</CardTitle>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>クリーチャーは、戦場に出した次のターンから攻撃できます（「速攻」能力を持つクリーチャーを除く）。</li>
                                <li>攻撃は相手プレイヤーに直接行います。相手は戦場にいるクリーチャーでブロックすることができます。</li>
                                <li>ブロックされなかったクリーチャーは、その攻撃力分のダメージを相手プレイヤーに与えます。</li>
                                <li>ブロックされた場合、攻撃クリーチャーとブロッククリーチャーがお互いにダメージを与え合います。防御力がダメージを上回れば、クリーチャーは生き残ります。</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
                 <Card>
                    <AccordionItem value="item-5">
                        <AccordionTrigger className="p-6">
                           <CardTitle className="flex items-center gap-2 text-left"><Users /> ゲームモード</CardTitle>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 space-y-4">
                            <div>
                                <h4 className="font-semibold text-lg flex items-center gap-2"><Bot /> AI対戦</h4>
                                <p className="text-muted-foreground">自分で作ったデッキを使って、3段階の難易度のAIと対戦します。勝利するとレーティングが上がり、ランキング上位を目指せます。</p>
                            </div>
                             <div>
                                <h4 className="font-semibold text-lg flex items-center gap-2"><Users /> オンライン対戦</h4>
                                <p className="text-muted-foreground">世界中のプレイヤーとリアルタイムで対戦します。自分のデッキの強さを試しましょう！</p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
            </Accordion>
        </div>
    );
}
