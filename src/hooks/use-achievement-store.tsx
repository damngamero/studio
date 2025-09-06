
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Leaf, Sprout, Star, Award, Heart, ShieldCheck, MessageSquare, BookOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from './use-toast';

const ACHIEVEMENT_STORE_KEY = 'verdantwise-achievements';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    unlocked: boolean;
    goal: number;
    check: (value: any) => boolean;
}

const allAchievements: Omit<Achievement, 'unlocked'>[] = [
    { id: 'first_plant', name: 'First Sprout', description: 'Add your first plant to your garden.', icon: Sprout, goal: 1, check: (plantCount: number) => plantCount >= 1 },
    { id: 'plant_collector', name: 'Green Thumb', description: 'Grow your collection to 5 plants.', icon: Leaf, goal: 5, check: (plantCount: number) => plantCount >= 5 },
    { id: 'plant_enthusiast', name: 'Plant Enthusiast', description: 'Cultivate a garden of 10 plants.', icon: Award, goal: 10, check: (plantCount: number) => plantCount >= 10 },
    { id: 'first_diagnosis', name: 'Budding Detective', description: 'Perform your first AI health check.', icon: ShieldCheck, goal: 1, check: (checkCount: number) => checkCount >= 1 },
    { id: 'first_chat', name: 'First Words', description: 'Chat with Sage about a plant for the first time.', icon: MessageSquare, goal: 1, check: () => false },
    { id: 'first_journal', name: 'Memory Keeper', description: 'Add your first journal entry.', icon: BookOpen, goal: 1, check: () => false },
    { id: 'healthy_week', name: 'Happy and Healthy', description: 'Keep a plant healthy for 7 consecutive days.', icon: Heart, goal: 7, check: () => false },
    { id: 'master_gardener', name: 'Master Gardener', description: 'Unlock all other achievements.', icon: Star, goal: 1, check: () => false },
];

function getInitialAchievements(): Achievement[] {
  if (typeof window === 'undefined') {
    return allAchievements.map(a => ({ ...a, unlocked: false }));
  }
  try {
    const item = window.localStorage.getItem(ACHIEVEMENT_STORE_KEY);
    const savedStates = item ? JSON.parse(item) : {};
    return allAchievements.map(a => ({ ...a, unlocked: !!savedStates[a.id] }));
  } catch (error) {
    console.error('Error reading achievements from localStorage', error);
    return allAchievements.map(a => ({ ...a, unlocked: false }));
  }
}

export function useAchievementStore() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

   useEffect(() => {
    // Correctly initialize state on the client
    setAchievements(getInitialAchievements());
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
        try {
            const achievementsToSave = achievements.reduce((acc, a) => {
                if (a.unlocked) {
                    acc[a.id] = true;
                }
                return acc;
            }, {} as Record<string, boolean>);
            window.localStorage.setItem(ACHIEVEMENT_STORE_KEY, JSON.stringify(achievementsToSave));
        } catch (error) {
            console.error('Error writing achievements to localStorage', error);
        }
    }
  }, [achievements, isInitialized]);


  const unlockAchievement = useCallback((achievementId: string) => {
    setAchievements(prevAchievements => {
        const achievementToUnlock = prevAchievements.find(a => a.id === achievementId);
        if (achievementToUnlock && !achievementToUnlock.unlocked) {
             toast({
                title: 'Achievement Unlocked!',
                description: `You've earned the "${achievementToUnlock.name}" badge.`,
                action: <div className="p-1.5 rounded-full bg-yellow-400"><Star className="h-4 w-4 text-white" /></div>
            });
            return prevAchievements.map(a => 
                a.id === achievementId ? { ...a, unlocked: true } : a
            );
        }
        return prevAchievements;
    });
  }, [toast]);

  const checkAndUnlock = useCallback((achievementIds: string[], value: any) => {
      achievementIds.forEach(id => {
          const achievement = achievements.find(a => a.id === id);
          if (achievement && !achievement.unlocked && achievement.check(value)) {
              unlockAchievement(id);
          }
      });
  }, [achievements, unlockAchievement]);

  const getAchievementCount = useCallback(() => {
    if (!isInitialized) return { unlocked: 0, total: allAchievements.length };
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    return { unlocked: unlockedCount, total: allAchievements.length };
  }, [achievements, isInitialized]);


  return { achievements, unlockAchievement, checkAndUnlock, isInitialized, getAchievementCount };
}
