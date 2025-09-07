
"use client";

import { create } from 'zustand';
import type { Achievement } from './use-achievement-store';

interface AchievementDialogState {
  achievement: Omit<Achievement, 'unlocked' | 'goal' | 'check'> | null;
  setAchievement: (achievement: Omit<Achievement, 'unlocked' | 'goal' | 'check'>) => void;
  clearAchievement: () => void;
}

export const useAchievementDialogStore = create<AchievementDialogState>((set) => ({
  achievement: null,
  setAchievement: (achievement) => set({ achievement }),
  clearAchievement: () => set({ achievement: null }),
}));
