
"use client";

import React, { type ReactNode, useEffect } from "react";
import { usePlantStore } from "@/hooks/use-plant-store";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { addDays, isAfter } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { playSound } from "@/lib/audio";


function useWateringReminder() {
  const { plants } = usePlantStore();
  const { settings } = useSettingsStore();
  const { toast } = useToast();
  // Keep track of which plants we've already notified the user about
  const [notifiedPlantIds, setNotifiedPlantIds] = React.useState<Set<string>>(new Set());

  useEffect(() => {
    if (!settings.wateringReminders) {
      return;
    }

    const checkReminders = () => {
      const overduePlants = plants.filter(plant => 
        plant.wateringFrequency && 
        isAfter(new Date(), addDays(new Date(plant.lastWatered), plant.wateringFrequency)) &&
        !notifiedPlantIds.has(plant.id)
      );

      if (overduePlants.length > 0) {
        const plantNames = overduePlants.map(p => p.customName).join(', ');
        toast({
            title: 'Watering Reminder',
            description: `Your plants need a drink: ${plantNames}`,
        });
        playSound('notification');

        // Add these plants to the notified set so we don't spam the user
        setNotifiedPlantIds(prev => {
            const newSet = new Set(prev);
            overduePlants.forEach(p => newSet.add(p.id));
            return newSet;
        });
      }
    };
    
    const timeoutId = setTimeout(checkReminders, 5000); // Check 5s after load
    const intervalId = setInterval(checkReminders, 60 * 60 * 1000); // Check every hour

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };

  }, [plants, settings.wateringReminders, toast, notifiedPlantIds]);
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
