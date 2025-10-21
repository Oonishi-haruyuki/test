
import type { Metadata } from "next";
import "./globals.css";
import { FirebaseProvider } from "@/firebase/provider";
import { AppHeader } from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { CurrencyProvider } from "@/components/currency-provider";
import { StatsProvider } from "@/components/stats-provider";
import { MissionsProvider } from "@/components/missions-provider";
import { InventoryProvider } from "@/components/inventory-provider";
import { ReactNode } from "react";

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
        <FirebaseProvider>
          <CurrencyProvider>
            <StatsProvider>
              <MissionsProvider>
                <InventoryProvider>
                  <div className="min-h-screen bg-background text-foreground">
                    <div className="container mx-auto px-4 py-8">
                      <AppHeader />
                      <main>{children}</main>
                    </div>
                    <Toaster />
                  </div>
                </InventoryProvider>
              </MissionsProvider>
            </StatsProvider>
          </CurrencyProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
