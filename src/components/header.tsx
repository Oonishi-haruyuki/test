
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from './currency-display';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/use-profile';
import { User } from 'lucide-react';


const navLinks = [
    { href: '/', label: '作成' },
    { href: '/collection', label: 'マイカード' },
    { href: '/deck-builder', label: 'デッキ構築' },
    { href: '/gacha', label: 'ガチャ' },
    { href: '/battle', label: 'AI対戦' },
    { href: '/online-battle', label: 'オンライン対戦' },
    { href: '/trade', label: 'トレード' },
    { href: '/rules', label: 'ルール' },
    { href: '/ranking', label: 'ランキング' },
    { href: '/shop', label: 'ショップ' },
    { href: '/minigame', label: 'ミニゲーム' },
];

export function AppHeader() {
  const pathname = usePathname();
  const { activeProfile, PROFILES } = useProfile();


  return (
    <header className="mb-8">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-primary">
          <Link href="/">カードクラフター</Link>
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          AIの力で、あなたのカードゲームのアイデアを形に
        </p>
      </div>
      <div className="flex justify-between items-center mt-4 border-b pb-4">
        <nav className="flex items-center space-x-2 lg:space-x-4 overflow-x-auto">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              asChild
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary shrink-0',
                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
            <Button
              variant="ghost"
              asChild
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary shrink-0',
                pathname === '/mypage' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Link href="/mypage">マイページ</Link>
            </Button>
        </nav>
        <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-5 w-5"/>
              <span>{PROFILES[activeProfile].name}</span>
            </div>
            <CurrencyDisplay />
        </div>
      </div>
    </header>
  );
}
