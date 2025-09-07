
"use client";

import React, { type ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, ScanLine, Settings, Menu, CloudSun, Trophy } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlantStore } from "@/hooks/use-plant-store";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { addDays, isAfter } from "date-fns";
import { useToast } from "@/hooks/use-toast";


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

function useWateringReminder() {
  const { plants } = usePlantStore();
  const { settings } = useSettingsStore();
  const { toast } = useToast();

  useEffect(() => {
    if (!settings.wateringReminders || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    const checkReminders = () => {
      const overduePlants = plants.filter(plant => 
        plant.wateringFrequency && isAfter(new Date(), addDays(new Date(plant.lastWatered), plant.wateringFrequency))
      );

      if (overduePlants.length > 0) {
        const plantNames = overduePlants.map(p => p.customName).join(', ');
        if (Notification.permission === 'granted') {
          new Notification('Time to water your plants!', {
            body: `Your plants need a drink: ${plantNames}`,
            icon: '/logo.png' 
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Time to water your plants!', {
                body: `Your plants need a drink: ${plantNames}`,
                icon: '/logo.png'
              });
            } else {
                 toast({
                    title: 'Watering Reminders Blocked',
                    description: "You've disabled notifications. To get reminders, please enable them in your browser settings.",
                    variant: 'destructive',
                 })
            }
          });
        }
      }
    };
    
    // Check reminders shortly after app loads and then periodically
    const timeoutId = setTimeout(checkReminders, 5000); // Check 5s after load
    const intervalId = setInterval(checkReminders, 6 * 60 * 60 * 1000); // Check every 6 hours

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };

  }, [plants, settings.wateringReminders, toast]);
}

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  useWateringReminder();

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
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
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          {/* Header content like User menu can go here */}
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
