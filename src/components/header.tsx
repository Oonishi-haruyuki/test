
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from './currency-display';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { User, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import React from 'react';


const navLinks = [
    { href: '/', label: '作成' },
    { href: '/collection', label: 'マイカード' },
    { href: '/deck-builder', label: 'デッキ構築' },
    { href: '/gacha', label: 'ガチャ' },
    { href: '/battle', label: 'AI対戦' },
    { href: '/online-battle', label: 'オンライン対戦' },
    { href: '/draft', label: 'ドラフト' },
    { href: '/trade', label: 'トレード' },
    { href: '/guild', label: 'ギルド' },
    { href: '/story', label: 'ストーリー' },
    { href: '/rules', label: 'ルール' },
    { href: '/ranking', label: 'ランキング' },
    { href: '/shop', label: 'ショップ' },
    { href: '/minigame', label: 'ミニゲーム' },
    { href: '/mypage', label: 'マイページ' },
];

export function AppHeader() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isSheetOpen, setSheetOpen] = React.useState(false);


  return (
    <header className="mb-8">
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">
          <Link href="/">カードクラフター</Link>
        </h1>
        <p className="text-muted-foreground mt-2 text-md md:text-lg">
          AIの力で、あなたのカードゲームのアイデアを形に
        </p>
      </div>
      <div className="flex justify-between items-center mt-4 border-b pb-4">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 overflow-x-auto">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              asChild
              className={cn(
                'text-xs lg:text-sm font-medium transition-colors hover:text-primary shrink-0',
                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        {/* Mobile Navigation */}
         <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                     <nav className="flex flex-col space-y-2 mt-8">
                        {navLinks.map((link) => (
                        <Button
                            key={link.href}
                            variant="ghost"
                            asChild
                            onClick={() => setSheetOpen(false)}
                            className={cn(
                            'justify-start text-lg',
                            pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                            )}
                        >
                            <Link href={link.href}>{link.label}</Link>
                        </Button>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
            {user && (
                 <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="h-5 w-5"/>
                    <span className="truncate max-w-[100px]">{user.email?.split('@')[0] || 'User'}</span>
                </div>
            )}
            <CurrencyDisplay />
        </div>
      </div>
    </header>
  );
}
