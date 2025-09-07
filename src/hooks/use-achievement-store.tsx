
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Leaf, Sprout, Star, Award, Heart, ShieldCheck, MessageSquare, BookOpen, Droplets, Sun, Wind, Cloud, Trees, Globe, Search, ThumbsUp, PencilRuler, Microscope, BrainCircuit, BotMessageSquare, Sparkles, CloudSun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from './use-toast';
import { usePlantStore } from './use-plant-store';

const ACHIEVEMENT_STORE_KEY = 'verdantwise-achievements';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    unlocked: boolean;
    goal: number;
    check: (value: any, plants?: any[]) => boolean;
}

const allAchievements: Omit<Achievement, 'unlocked'>[] = [
    // Existing
    { id: 'first_plant', name: 'First Sprout', description: 'Add your first plant to your garden.', icon: Sprout, goal: 1, check: (plantCount: number) => plantCount >= 1 },
    { id: 'plant_collector', name: 'Green Thumb', description: 'Grow your collection to 5 plants.', icon: Leaf, goal: 5, check: (plantCount: number) => plantCount >= 5 },
    { id: 'plant_enthusiast', name: 'Plant Enthusiast', description: 'Cultivate a garden of 10 plants.', icon: Award, goal: 10, check: (plantCount: number) => plantCount >= 10 },
    { id: 'first_diagnosis', name: 'Budding Detective', description: 'Perform your first AI health check.', icon: ShieldCheck, goal: 1, check: (checkCount: number) => checkCount >= 1 },
    { id: 'first_chat', name: 'First Words', description: 'Chat with Sage about a plant for the first time.', icon: MessageSquare, goal: 1, check: (chatCount: number) => chatCount >= 1 },
    { id: 'first_journal', name: 'Memory Keeper', description: 'Add your first journal entry.', icon: BookOpen, goal: 1, check: (entryCount: number) => entryCount >= 1 },
    
    // New
    { id: 'urban_jungle', name: 'Urban Jungle', description: 'Your collection has grown to 25 plants!', icon: Trees, goal: 25, check: (plantCount: number) => plantCount >= 25 },
    { id: 'botanical_garden', name: 'Botanical Garden', description: 'A massive collection of 50 plants!', icon: Globe, goal: 50, check: (plantCount: number) => plantCount >= 50 },
    { id: 'five_diagnoses', name: 'Plant Doctor', description: 'Perform 5 AI health checks.', icon: Microscope, goal: 5, check: (checkCount: number) => checkCount >= 5 },
    { id: 'ten_chats', name: 'Sage Advisor', description: 'Chat with Sage 10 times.', icon: BotMessageSquare, goal: 10, check: (chatCount: number) => chatCount >= 10 },
    { id: 'five_journal_entries', name: 'Diligent Chronicler', description: 'Write 5 journal entries.', icon: PencilRuler, goal: 5, check: (entryCount: number) => entryCount >= 5 },
    { id: 'nickname_artist', name: 'Nickname Artist', description: 'Use one of Sage\'s suggested nicknames.', icon: Sparkles, goal: 1, check: (usedSuggestion: boolean) => usedSuggestion },
    { id: 'placement_pro', name: 'Placement Pro', description: 'Get placement feedback for a plant.', icon: ThumbsUp, goal: 1, check: (feedbackCount: number) => feedbackCount >= 1 },
    { id: 'weather_watcher', name: 'Weather Watcher', description: 'Check the weather page for the first time.', icon: CloudSun, goal: 1, check: (checkedWeather: boolean) => checkedWeather },
    { id: 'water_warrior_10', name: 'Water Warrior', description: 'Water your plants 10 times in total.', icon: Droplets, goal: 10, check: (waterCount: number) => waterCount >= 10 },
    { id: 'water_warrior_50', name: 'Hydration Hero', description: 'Water your plants 50 times in total.', icon: Wind, goal: 50, check: (waterCount: number) => waterCount >= 50 },
    { id: 'tip_regenerator', name: 'Knowledge Seeker', description: 'Regenerate care tips for a plant.', icon: BrainCircuit, goal: 1, check: (regenCount: number) => regenCount >= 1 },
    { id: 'species_collector_5', name: 'Species Collector', description: 'Own 5 different types of plants.', icon: Search, goal: 5, check: (value: any, plants: any[] = []) => new Set(plants.map(p => p.commonName)).size >= 5 },
    { id: 'species_collector_10', name: 'Botanist', description: 'Own 10 different types of plants.', icon: Award, goal: 10, check: (value: any, plants: any[] = []) => new Set(plants.map(p => p.commonName)).size >= 10 },

    // Not yet implemented fully
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
  const { plants } = usePlantStore();

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
    setTimeout(() => {
      achievementIds.forEach(id => {
          const achievement = achievements.find(a => a.id === id);
          if (achievement && !achievement.unlocked && achievement.check(value, plants)) {
              unlockAchievement(id);
          }
      });
    }, 0);
  }, [achievements, unlockAchievement, plants]);

  const getAchievementCount = useCallback(() => {
    if (!isInitialized) return { unlocked: 0, total: allAchievements.length };
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    return { unlocked: unlockedCount, total: allAchievements.length };
  }, [achievements, isInitialized]);


  return { achievements, unlockAchievement, checkAndUnlock, isInitialized, getAchievementCount };
}
