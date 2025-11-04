
import type { Metadata } from "next";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ReactNode } from "react";
import { CurrencyProvider } from "@/components/currency-provider";
import { StatsProvider } from "@/components/stats-provider";
import { MissionsProvider } from "@/components/missions-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "カードクラフター",
  description: "AIの力で、あなたのカードゲームのアイデアを形に",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
      </head>
      <body className="antialiased">
        <FirebaseClientProvider>
          <CurrencyProvider>
            <StatsProvider>
              <MissionsProvider>
                  <div className="min-h-screen bg-background text-foreground">
                    <div className="container mx-auto px-4 py-8">
                       {children}
                    </div>
                    <Toaster />
                  </div>
              </MissionsProvider>
            </StatsProvider>
          </CurrencyProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
