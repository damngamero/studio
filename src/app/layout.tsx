"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useEffect } from 'react';

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
        <title>VerdantWise</title>
        <meta name="description" content="A smart gardening assistant app for plant care." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
