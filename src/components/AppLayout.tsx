"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, ScanLine, Settings } from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold font-headline text-lg text-foreground">
      <Leaf className="h-6 w-6 text-accent" />
      <span>VerdantWise</span>
    </Link>
  )
}

const navItems = [
  { href: "/", label: "My Plants", icon: Leaf },
  { href: "/identify", label: "Identify Plant", icon: ScanLine },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <div className="flex h-14 items-center justify-center p-2 group-data-[collapsible=icon]:h-14">
              <div className="group-data-[collapsible=icon]:hidden">
                  <Logo />
              </div>
              <div className="hidden group-data-[collapsible=icon]:block">
                  <Leaf className="h-6 w-6 text-accent" />
              </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 md:hidden">
          <SidebarTrigger />
          <Logo />
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
