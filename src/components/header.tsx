
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from './currency-display';
import { SignInButton } from './sign-in-button';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import React from 'react';


const navLinks = [
    { href: '/', label: '作成' },
    { href: '/collection', label: 'マイカード' },
    { href: '/deck-builder', label: 'デッキ構築' },
    { href: '/draft', label: 'ドラフト' },
    { href: '/battle', label: 'AI対戦' },
    { href: '/story', label: 'ストーリー' },
];

const secondaryLinks = [
  { href: '/mypage', label: 'マイページ' },
  { href: '/settings', label: '設定' },
    { href: '/rules', label: 'ルール' },
    { href: '/minigame', label: 'ミニゲーム' },
]

export function AppHeader() {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = React.useState(false);


  return (
    <header className="mb-8">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          <Link href="/">カードクラフター</Link>
        </h1>
        <div className="flex items-center gap-4">
            <CurrencyDisplay />
            <SignInButton />
        </div>
      </div>
      <div className="flex justify-between items-center mt-2 border-b pb-2">
        <nav className="hidden md:flex items-center space-x-1 overflow-x-auto">
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
        </nav>

         <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[250px]">
                     <nav className="flex flex-col space-y-2 mt-8">
                        <p className="text-lg font-semibold px-4">Menu</p>
                        {[...navLinks, ...secondaryLinks].map((link) => (
                        <Button
                            key={link.href}
                            variant="ghost"
                            asChild
                            onClick={() => setSheetOpen(false)}
                            className={cn(
                            'justify-start text-base',
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
        
        <nav className="hidden md:flex items-center space-x-1 overflow-x-auto">
          {secondaryLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              asChild
              className={cn(
                'text-xs font-medium transition-colors hover:text-primary shrink-0',
                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
