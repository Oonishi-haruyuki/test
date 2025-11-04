'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Lock, Coins } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from '@/hooks/use-toast';

type Stage = {
  id: string; // e.g., "1-1", "1-2"
  title: string;
  opponent: string;
  rules: {
    playerHealth: number;
    opponentHealth: number;
    boardLimit: number;
    disallowedCardTypes: string[];
  };
  reward: number;
};

type Chapter = {
  id: number;
  title: string;
  description: string;
  stages: Stage[];
  chapterReward: number;
};

const generateStages = (chapterId: number): Stage[] => {
    const stages: Stage[] = [];
    const opponents = ['ゴブリンの斥候', 'ゴブリンの戦士', 'ゴブリンの魔術師', 'ゴブリンの射手', 'ゴブリンの用心棒', 'ゴブリンの小隊長', 'ゴブリンの精鋭', 'ゴブリンのチャンピオン', 'ゴブリンの将軍', 'ゴブリンキング'];
    const healthPool = [10, 12, 12, 14, 14, 15, 16, 17, 18, 20];
    for (let i = 1; i <= 10; i++) {
        stages.push({
            id: `${chapterId}-${i}`,
            title: `ステージ ${chapterId}-${i}`,
            opponent: opponents[i-1],
            rules: {
                playerHealth: 20,
                opponentHealth: healthPool[i-1],
                boardLimit: 3 + Math.floor(i/3),
                disallowedCardTypes: i > 5 ? [] : ['artifact'],
            },
            reward: 10,
        });
    }
    return stages;
};

const chapters: Chapter[] = [
  {
    id: 1,
    title: '第1章: ゴブリンの侵略',
    description: 'カードクラフターとしての最初の試練。森の奥で待ち構えるゴブリンの群れを打ち破れ！',
    stages: generateStages(1),
    chapterReward: 500,
  },
   {
    id: 2,
    title: '第2章: 蘇る骸',
    description: '不気味な墓地から、アンデッドの軍勢が現れた。ネクロマンサーの野望を打ち砕け！',
    stages: generateStages(2),
    chapterReward: 500,
  },
  {
    id: 3,
    title: '第3章: ドラゴンの巣',
    description: '灼熱の火山に住まう、伝説のドラゴンに挑め。その力は計り知れない。',
    stages: generateStages(3),
    chapterReward: 500,
  },
   {
    id: 4,
    title: '第4章: 影の襲撃',
    description: '闇に潜むニンジャの一団が、あなたの前に立ちはだかる。素早い攻撃を見極めろ。',
    stages: generateStages(4),
    chapterReward: 500,
  },
  {
    id: 5,
    title: '第5章: 元素の渦',
    description: '四大元素の精霊たちが、荒れ狂っている。世界のバランスを取り戻すのだ。',
    stages: generateStages(5),
    chapterReward: 500,
  },
];

export default function StoryPage() {
  const router = useRouter();
  const [clearedStages, setClearedStages] = useState<Set<string>>(new Set());
  const [claimedChapterRewards, setClaimedChapterRewards] = useState<Set<number>>(new Set());
  const { addCurrency } = useCurrency();
  const { toast } = useToast();

  useEffect(() => {
    const cleared = new Set<string>();
    chapters.forEach(chapter => {
      chapter.stages.forEach(stage => {
        if (localStorage.getItem(`story-stage-${stage.id}-cleared`) === 'true') {
          cleared.add(stage.id);
        }
      });
    });
    setClearedStages(cleared);

    const claimed = new Set<number>();
    chapters.forEach(chapter => {
       if (localStorage.getItem(`story-chapter-${chapter.id}-reward-claimed`) === 'true') {
          claimed.add(chapter.id);
       }
    });
    setClaimedChapterRewards(claimed);
  }, []);


  const handleStartStage = (stage: Stage) => {
    const params = new URLSearchParams({
        stageId: stage.id,
        playerHealth: stage.rules.playerHealth.toString(),
        opponentHealth: stage.rules.opponentHealth.toString(),
        boardLimit: stage.rules.boardLimit.toString(),
        disallowedCardTypes: stage.rules.disallowedCardTypes.join(','),
        reward: stage.reward.toString(),
    });
    router.push(`/story-battle?${params.toString()}`);
  };

  const handleClaimChapterReward = (chapter: Chapter) => {
    addCurrency(chapter.chapterReward);
    const newClaimed = new Set(claimedChapterRewards);
    newClaimed.add(chapter.id);
    setClaimedChapterRewards(newClaimed);
    localStorage.setItem(`story-chapter-${chapter.id}-reward-claimed`, 'true');
    toast({
        title: '報酬獲得！',
        description: `${chapter.title}をクリアし、${chapter.chapterReward}Gを獲得しました！`,
    });
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-4">ストーリーモード</h1>
      <p className="text-muted-foreground text-center mb-8">カードクラフターの世界を冒険し、最強の称号を目指せ。</p>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {chapters.map((chapter) => {
            const clearedInChapter = chapter.stages.filter(s => clearedStages.has(s.id)).length;
            const isChapterComplete = clearedInChapter === chapter.stages.length;
            const isRewardClaimed = claimedChapterRewards.has(chapter.id);

            return (
              <Card key={chapter.id}>
                <AccordionItem value={`chapter-${chapter.id}`} className="border-b-0">
                    <AccordionTrigger className="p-6 hover:no-underline">
                        <div className='flex justify-between items-center w-full'>
                            <div>
                                <CardTitle className="flex items-center gap-2">{chapter.title}</CardTitle>
                                <CardDescription>{chapter.description}</CardDescription>
                            </div>
                            <div className="text-sm text-muted-foreground mr-4">
                                {clearedInChapter} / {chapter.stages.length} クリア
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <div className="space-y-4">
                            {chapter.stages.map((stage, index) => {
                                const isUnlocked = index === 0 || clearedStages.has(chapter.stages[index-1].id);
                                const isCleared = clearedStages.has(stage.id);
                                return (
                                    <div key={stage.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                                        <div className="flex items-center gap-4">
                                            {isCleared ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : isUnlocked ? <div className="h-6 w-6"></div> : <Lock className="h-6 w-6 text-muted-foreground" />}
                                            <div>
                                                <p className={`font-semibold ${!isUnlocked && 'text-muted-foreground'}`}>{stage.title}: {stage.opponent}と対戦</p>
                                                <p className="text-xs text-muted-foreground">報酬: {stage.reward}G</p>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => handleStartStage(stage)} disabled={!isUnlocked}>
                                            {isCleared ? '再挑戦' : '挑戦する'}
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                        {isChapterComplete && !isRewardClaimed && (
                            <div className="mt-6 text-center">
                                <Button size="lg" onClick={() => handleClaimChapterReward(chapter)}>
                                    <Coins className="mr-2"/>
                                    チャプタークリア報酬 ({chapter.chapterReward}G) を受け取る
                                </Button>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
              </Card>
            )
        })}
      </Accordion>
    </div>
  );
}
