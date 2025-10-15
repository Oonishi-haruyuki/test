
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CurrencyProvider } from "@/components/currency-provider";
import { StatsProvider } from "@/components/stats-provider";
import { FirebaseClientProvider } from "@/firebase";
import { AppHeader } from "@/components/header";

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
        <FirebaseClientProvider>
          <StatsProvider>
            <CurrencyProvider>
              <div className="min-h-screen bg-background text-foreground">
                <div className="container mx-auto px-4 py-8">
                  <AppHeader />
                  <main className="mt-8">{children}</main>
                </div>
              </div>
              <Toaster />
            </CurrencyProvider>
          </StatsProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
