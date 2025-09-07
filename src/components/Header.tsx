
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, ScanLine, Settings, Menu, CloudSun, Trophy } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-foreground">
      <Leaf className="h-7 w-7 text-primary" />
      <span className="font-bold text-xl font-heading">VerdantWise</span>
    </Link>
  )
}

const navItems = [
  { href: "/", label: "My Plants", icon: Leaf },
  { href: "/identify", label: "Identify Plant", icon: ScanLine },
  { href: "/weather", label: "Weather", icon: CloudSun },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLink({ href, label, icon: Icon, currentPath }: { href: string, label: string, icon: React.ElementType, currentPath: string }) {
  const isActive = currentPath === href;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary whitespace-nowrap",
        isActive && "bg-muted text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

function Navigation() {
    const pathname = usePathname();
    return (
        <>
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Logo />
                {navItems.map((item) => (
                    <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} currentPath={pathname} />
                ))}
            </nav>
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                    >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <nav className="grid gap-6 text-lg font-medium">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 mb-4">
                        <Logo />
                    </div>
                    {navItems.map((item) => (
                        <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} currentPath={pathname} />
                    ))}
                    </nav>
                </SheetContent>
            </Sheet>
        </>
    )
}


export function Header() {
    return (
         <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
            <Navigation />
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            {/* Header content like User menu can go here */}
            </div>
      </header>
    )
}
