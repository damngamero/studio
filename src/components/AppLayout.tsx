
"use client";

import React, { type ReactNode, useEffect } from "react";
import { usePlantStore } from "@/hooks/use-plant-store";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { addDays, isAfter } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Header } from "./Header";
import { Footer } from "./Footer";


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
  useWateringReminder();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
