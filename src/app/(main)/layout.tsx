
import { AppHeader } from "@/components/header";
import { CurrencyProvider } from "@/components/currency-provider";
import { StatsProvider } from "@/components/stats-provider";
import { MissionsProvider } from "@/components/missions-provider";
import { InventoryProvider } from "@/components/inventory-provider";
import { Toaster } from "@/components/ui/toaster";
import { ReactNode } from "react";

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
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
  );
}
