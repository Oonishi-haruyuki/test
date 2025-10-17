
'use client';

import { CurrencyProvider } from "@/components/currency-provider";
import { AppHeader } from "@/components/header";
import { InventoryProvider } from "@/components/inventory-provider";
import { MissionsProvider } from "@/components/missions-provider";
import { StatsProvider } from "@/components/stats-provider";
import { Toaster } from "@/components/ui/toaster";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <StatsProvider>
            <CurrencyProvider>
                <InventoryProvider>
                    <MissionsProvider>
                        <div className="min-h-screen bg-background text-foreground">
                            <div className="container mx-auto px-4 py-8">
                                <AppHeader />
                                <main className="mt-8">{children}</main>
                            </div>
                        </div>
                        <Toaster />
                    </MissionsProvider>
                </InventoryProvider>
            </CurrencyProvider>
        </StatsProvider>
    );
}
