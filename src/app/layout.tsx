
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CurrencyProvider } from "@/components/currency-provider";
import { CurrencyDisplay } from "@/components/currency-display";
import { StatsProvider } from "@/components/stats-provider";

export const metadata: Metadata = {
  title: "カードクラフター",
  description: "AIの力で、あなたのカードゲームのアイデアを形に",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
      </head>
      <body className="antialiased">
        <StatsProvider>
          <CurrencyProvider>
            <div className="min-h-screen bg-background text-foreground">
              <div className="container mx-auto px-4 py-8">
                <header className="mb-12">
                  <div className="text-center">
                    <h1 className="text-5xl font-bold text-primary">
                      <Link href="/">カードクラフター</Link>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                      AIの力で、あなたのカードゲームのアイデアを形に
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <nav>
                      <Button variant="outline" asChild>
                        <Link href="/">作成</Link>
                      </Button>
                      <Button variant="outline" asChild className="ml-4">
                        <Link href="/collection">マイカード</Link>
                      </Button>
                      <Button variant="outline" asChild className="ml-4">
                        <Link href="/mypage">マイページ</Link>
                      </Button>
                      <Button variant="outline" asChild className="ml-4">
                        <Link href="/gacha">ガチャ</Link>
                      </Button>
                      <Button variant="outline" asChild className="ml-4">
                        <Link href="/shop">ショップ</Link>
                      </Button>
                      <Button variant="outline" asChild className="ml-4">
                        <Link href="/deck-builder">デッキ構築</Link>
                      </Button>
                      <Button variant="outline" asChild className="ml-4">
                        <Link href="/battle">AI対戦</Link>
                      </Button>
                      <Button variant="outline" asChild className="ml-4">
                        <Link href="/online-battle">オンライン対戦</Link>
                      </Button>
                      <Button variant="outline" asChild className="ml-4">
                        <Link href="/minigame">ミニゲーム</Link>
                      </Button>
                    </nav>
                    <CurrencyDisplay />
                  </div>
                </header>
                {children}
              </div>
            </div>
            <Toaster />
          </CurrencyProvider>
        </StatsProvider>
      </body>
    </html>
  );
}

    