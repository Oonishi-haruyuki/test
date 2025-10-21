
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

type Chapter = {
  id: number;
  title: string;
  description: string;
  opponent: string;
  rules: {
    playerHealth: number;
    opponentHealth: number;
    boardLimit: number;
    landLimit: number;
    disallowedCardTypes: string[];
  };
};

const chapters: Chapter[] = [
  {
    id: 1,
    title: '第1章: ゴブリンの森',
    description: 'カードクラフターとしての最初の試練。森の奥で待ち構えるゴブリンの群れを打ち破れ！',
    opponent: 'ゴブリンシャーマン',
    rules: { playerHealth: 20, opponentHealth: 15, boardLimit: 3, landLimit: 2, disallowedCardTypes: ['artifact'] },
  },
   {
    id: 2,
    title: '第2章: 蘇る骸',
    description: '不気味な墓地から、アンデッドの軍勢が現れた。ネクロマンサーの野望を打ち砕け！',
    opponent: 'ネクロマンサー',
    rules: { playerHealth: 20, opponentHealth: 15, boardLimit: 3, landLimit: 2, disallowedCardTypes: ['artifact'] },
  },
  {
    id: 3,
    title: '第3章: ドラゴンの巣',
    description: '灼熱の火山に住まう、伝説のドラゴンに挑め。その力は計り知れない。',
    opponent: 'エンシェント・ドラゴン',
    rules: { playerHealth: 20, opponentHealth: 15, boardLimit: 3, landLimit: 2, disallowedCardTypes: ['artifact'] },
  },
   {
    id: 4,
    title: '第4章: 影の襲撃',
    description: '闇に潜むニンジャの一団が、あなたの前に立ちはだかる。素早い攻撃を見極めろ。',
    opponent: 'ニンジャマスター',
    rules: { playerHealth: 20, opponentHealth: 15, boardLimit: 3, landLimit: 2, disallowedCardTypes: ['artifact'] },
  },
  {
    id: 5,
    title: '第5章: 元素の渦',
    description: '四大元素の精霊たちが、荒れ狂っている。世界のバランスを取り戻すのだ。',
    opponent: 'エレメンタル・ロード',
    rules: { playerHealth: 20, opponentHealth: 15, boardLimit: 3, landLimit: 2, disallowedCardTypes: ['artifact'] },
  },
];

export default function StoryPage() {
  const router = useRouter();
  const [clearedChapters, setClearedChapters] = useState<Set<number>>(new Set());

  useEffect(() => {
    const cleared = new Set<number>();
    chapters.forEach(chapter => {
      if (localStorage.getItem(`story-ch${chapter.id}-cleared`) === 'true') {
        cleared.add(chapter.id);
      }
    });
    setClearedChapters(cleared);
  }, []);


  const handleStartChapter = (chapter: Chapter) => {
    const params = new URLSearchParams({
        story: 'true',
        chapter: chapter.id.toString(),
        playerHealth: chapter.rules.playerHealth.toString(),
        opponentHealth: chapter.rules.opponentHealth.toString(),
        boardLimit: chapter.rules.boardLimit.toString(),
        landLimit: chapter.rules.landLimit.toString(),
        disallowedCardTypes: chapter.rules.disallowedCardTypes.join(','),
    });
    router.push(`/battle?${params.toString()}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-4">ストーリーモード</h1>
      <p className="text-muted-foreground text-center mb-8">カードクラフターの世界を冒険し、最強の称号を目指せ。</p>

      <div className="space-y-6">
        {chapters.map((chapter) => (
          <Card key={chapter.id} className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="md:col-span-2 p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="flex items-center gap-2">
                     {chapter.title}
                     {clearedChapters.has(chapter.id) && <CheckCircle2 className="text-green-500"/>}
                  </CardTitle>
                  <CardDescription>{chapter.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-sm space-y-2">
                     <p><strong>対戦相手:</strong> {chapter.opponent}</p>
                     <p className="font-semibold">特別ルール:</p>
                     <ul className="list-disc list-inside text-muted-foreground">
                        <li>あなたのHP: {chapter.rules.playerHealth}, AIのHP: {chapter.rules.opponentHealth}</li>
                        <li>クリーチャーの配置は{chapter.rules.boardLimit}体まで</li>
                        <li>土地の配置は{chapter.rules.landLimit}つまで</li>
                        <li>使用禁止カードタイプ: {chapter.rules.disallowedCardTypes.join(', ') || 'なし'}</li>
                     </ul>
                  </div>
                </CardContent>
              </div>
              <div className="bg-secondary/50 flex items-center justify-center p-6">
                <Button size="lg" onClick={() => handleStartChapter(chapter)}>
                  この章に挑戦する
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
