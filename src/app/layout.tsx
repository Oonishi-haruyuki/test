import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "CardCrafter",
  description: "Bring your card game ideas to life with the power of AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <div className="min-h-screen bg-background text-foreground">
          <div className="container mx-auto px-4 py-8">
            <header className="text-center mb-12">
              <h1 className="text-5xl font-bold font-headline text-primary">
                <Link href="/">CardCrafter</Link>
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Bring your card game ideas to life with the power of AI
              </p>
              <nav className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/">Create</Link>
                </Button>
                <Button variant="outline" asChild className="ml-4">
                  <Link href="/battle">Battle</Link>
                </Button>
              </nav>
            </header>
            {children}
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
