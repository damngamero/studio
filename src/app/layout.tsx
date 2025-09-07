
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useEffect } from 'react';
import { Inter, Lexend } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AchievementDialog } from '@/components/AchievementDialog';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontHeading = Lexend({
  subsets: ['latin'],
  variable: '--font-heading',
})


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme } = useSettingsStore();

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>VerdantWise - Your Smart Plant Companion</title>
        <meta name="description" content="VerdantWise is an AI-powered smart gardening assistant to help you identify, care for, and nurture your plants." />
      </head>
      <body className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontHeading.variable
        )}>
        {children}
        <Toaster />
        <AchievementDialog />
      </body>
    </html>
  );
}
