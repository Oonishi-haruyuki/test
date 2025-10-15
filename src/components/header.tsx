
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CurrencyDisplay } from './currency-display';
import { Skeleton } from './ui/skeleton';
import { LogOut, LayoutDashboard, User as UserIcon, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';

const navLinks = [
    { href: '/', label: '作成' },
    { href: '/collection', label: 'マイカード' },
    { href: '/deck-builder', label: 'デッキ構築' },
    { href: '/gacha', label: 'ガチャ' },
    { href: '/battle', label: 'AI対戦' },
    { href: '/online-battle', label: 'オンライン対戦' },
    { href: '/shop', label: 'ショップ' },
    { href: '/minigame', label: 'ミニゲーム' },
];

export function AppHeader() {
  const { user, profile, isUserLoading } = useUser();
  const auth = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const UserMenu = () => {
    if (isUserLoading) {
      return (
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      );
    }

    if (user) {
      return (
        <div className="flex items-center gap-4">
          <CurrencyDisplay />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL || undefined} alt={profile?.name || user.email || ''} />
                  <AvatarFallback>
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : <UserIcon />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.name || user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/mypage">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>マイページ</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>ログアウト</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    return (
      <Button asChild>
        <Link href="/login">
          <LogIn className="mr-2" />
          ログイン/登録
        </Link>
      </Button>
    );
  };


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
        <nav className="flex items-center space-x-2 lg:space-x-4">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              asChild
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center">
            <UserMenu />
        </div>
      </div>
    </header>
  );
}
