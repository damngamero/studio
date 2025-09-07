

"use client";

import { useState, useEffect, useCallback } from 'react';
import { Leaf, Sprout, Star, Award, Heart, ShieldCheck, MessageSquare, BookOpen, Droplets, Sun, Wind, Cloud, Trees, Globe, Search, ThumbsUp, PencilRuler, Microscope, BrainCircuit, BotMessageSquare, Sparkles, CloudSun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from './use-toast';
import { usePlantStore } from './use-plant-store';
import { useAchievementDialogStore } from './use-achievement-dialog-store';
import { useSound } from './use-sound';
import { playAudio } from '@/lib/audio';
import { useSettingsStore } from './use-settings-store';

const ACHIEVEMENT_STORE_KEY = 'verdantwise-achievements';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    unlocked: boolean;
    goal: number;
    rarity: Rarity;
    check: (value: any, plants?: any[]) => boolean;
}

const allAchievements: Omit<Achievement, 'unlocked'>[] = [
    // Common
    { id: 'first_plant', name: 'First Sprout', description: 'Add your first plant to your garden.', icon: Sprout, goal: 1, rarity: 'Common', check: (plantCount: number) => plantCount >= 1 },
    { id: 'first_diagnosis', name: 'Budding Detective', description: 'Perform your first AI health check.', icon: ShieldCheck, goal: 1, rarity: 'Common', check: (checkCount: number) => checkCount >= 1 },
    { id: 'first_chat', name: 'First Words', description: 'Chat with Sage about a plant for the first time.', icon: MessageSquare, goal: 1, rarity: 'Common', check: (chatCount: number) => chatCount >= 1 },
    { id: 'first_journal', name: 'Memory Keeper', description: 'Add your first journal entry.', icon: BookOpen, goal: 1, rarity: 'Common', check: (entryCount: number) => entryCount >= 1 },
    { id: 'weather_watcher', name: 'Weather Watcher', description: 'Check the weather page for the first time.', icon: CloudSun, goal: 1, rarity: 'Common', check: (checkedWeather: boolean) => checkedWeather },
    { id: 'water_warrior_10', name: 'Water Warrior', description: 'Water your plants 10 times in total.', icon: Droplets, goal: 10, rarity: 'Common', check: (waterCount: number) => waterCount >= 10 },
    
    // Uncommon
    { id: 'plant_collector', name: 'Green Thumb', description: 'Grow your collection to 5 plants.', icon: Leaf, goal: 5, rarity: 'Uncommon', check: (plantCount: number) => plantCount >= 5 },
    { id: 'five_diagnoses', name: 'Plant Doctor', description: 'Perform 5 AI health checks.', icon: Microscope, goal: 5, rarity: 'Uncommon', check: (checkCount: number) => checkCount >= 5 },
    { id: 'five_journal_entries', name: 'Diligent Chronicler', description: 'Write 5 journal entries.', icon: PencilRuler, goal: 5, rarity: 'Uncommon', check: (entryCount: number) => entryCount >= 5 },
    { id: 'nickname_artist', name: 'Nickname Artist', description: 'Use one of Sage\'s suggested nicknames.', icon: Sparkles, goal: 1, rarity: 'Uncommon', check: (usedSuggestion: boolean) => usedSuggestion },
    { id: 'placement_pro', name: 'Placement Pro', description: 'Get placement feedback for a plant.', icon: ThumbsUp, goal: 1, rarity: 'Uncommon', check: (feedbackCount: number) => feedbackCount >= 1 },
    { id: 'water_warrior_50', name: 'Hydration Hero', description: 'Water your plants 50 times in total.', icon: Wind, goal: 50, rarity: 'Uncommon', check: (waterCount: number) => waterCount >= 50 },
    { id: 'species_collector_5', name: 'Species Collector', description: 'Own 5 different types of plants.', icon: Search, goal: 5, rarity: 'Uncommon', check: (value: any, plants: any[] = []) => new Set(plants.map(p => p.commonName)).size >= 5 },
    
    // Rare
    { id: 'plant_enthusiast', name: 'Plant Enthusiast', description: 'Cultivate a garden of 10 plants.', icon: Award, goal: 10, rarity: 'Rare', check: (plantCount: number) => plantCount >= 10 },
    { id: 'ten_chats', name: 'Sage Advisor', description: 'Chat with Sage 10 times.', icon: BotMessageSquare, goal: 10, rarity: 'Rare', check: (chatCount: number) => chatCount >= 10 },
    { id: 'tip_regenerator', name: 'Knowledge Seeker', description: 'Regenerate care tips for a plant.', icon: BrainCircuit, goal: 1, rarity: 'Rare', check: (regenCount: number) => regenCount >= 1 },
    { id: 'species_collector_10', name: 'Botanist', description: 'Own 10 different types of plants.', icon: Award, goal: 10, rarity: 'Rare', check: (value: any, plants: any[] = []) => new Set(plants.map(p => p.commonName)).size >= 10 },

    // Epic
    { id: 'urban_jungle', name: 'Urban Jungle', description: 'Your collection has grown to 25 plants!', icon: Trees, goal: 25, rarity: 'Epic', check: (plantCount: number) => plantCount >= 25 },
    { id: 'healthy_week', name: 'Happy and Healthy', description: 'Keep a plant healthy for 7 consecutive days.', icon: Heart, goal: 7, rarity: 'Epic', check: () => false }, // Not yet implemented fully
    
    // Legendary
    { id: 'botanical_garden', name: 'Botanical Garden', description: 'A massive collection of 50 plants!', icon: Globe, goal: 50, rarity: 'Legendary', check: (plantCount: number) => plantCount >= 50 },
    { id: 'master_gardener', name: 'Master Gardener', description: 'Unlock all other achievements.', icon: Star, goal: 1, rarity: 'Legendary', check: () => false },
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
  const { setAchievement: setAchievementToDisplay } = useAchievementDialogStore();
  const { plants } = usePlantStore();
  const { settings } = useSettingsStore();


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
            const { unlocked, goal, check, ...displayAchievement } = achievementToUnlock;
            setAchievementToDisplay(displayAchievement);
            if (settings.soundEffectsEnabled) {
                playAudio('achievement');
            }

            return prevAchievements.map(a => 
                a.id === achievementId ? { ...a, unlocked: true } : a
            );
        }
        return prevAchievements;
    });
  }, [setAchievementToDisplay, settings.soundEffectsEnabled]);

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
