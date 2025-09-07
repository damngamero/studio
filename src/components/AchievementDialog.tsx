
"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { useAchievementDialogStore } from '@/hooks/use-achievement-dialog-store';
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Rarity } from '@/hooks/use-achievement-store';
import { Badge } from './ui/badge';

const rarityStyles: Record<Rarity, { dialog: string; badge: string; }> = {
    Common: {
        dialog: "border-gray-300",
        badge: "bg-gray-200 text-gray-800 border-gray-300"
    },
    Uncommon: {
        dialog: "border-green-300",
        badge: "bg-green-200 text-green-800 border-green-300"
    },
    Rare: {
        dialog: "border-blue-300",
        badge: "bg-blue-200 text-blue-800 border-blue-300"
    },
    Epic: {
        dialog: "border-purple-300",
        badge: "bg-purple-200 text-purple-800 border-purple-300"
    },
    Legendary: {
        dialog: "border-yellow-300",
        badge: "bg-yellow-200 text-yellow-800 border-yellow-300"
    },
};

export function AchievementDialog() {
  const { achievement, clearAchievement } = useAchievementDialogStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(!!achievement);
  }, [achievement]);

  if (!achievement) {
    return null;
  }

  const handleClose = () => {
    // Add a closing animation class
    const content = document.querySelector('[data-radix-dialog-content]');
    content?.classList.add('animate-out', 'fade-out-0', 'zoom-out-95');
    setTimeout(() => {
      clearAchievement();
    }, 300); // Match animation duration
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn("max-w-sm text-center border-4", rarityStyles[achievement.rarity].dialog)}>
        <DialogHeader className="items-center">
          <div className={cn("rounded-full p-4 w-24 h-24 flex items-center justify-center mb-4 border-8", rarityStyles[achievement.rarity].dialog)}>
            <achievement.icon className="w-12 h-12 text-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold font-heading">Achievement Unlocked!</DialogTitle>
          <Badge variant="outline" className={cn("mx-auto", rarityStyles[achievement.rarity].badge)}>
              {achievement.rarity}
          </Badge>
          <DialogDescription className="text-lg font-semibold text-foreground pt-2">{achievement.name}</DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground">{achievement.description}</p>
        <Button onClick={handleClose} className="mt-4">
            <Award className="mr-2 h-4 w-4" /> Awesome!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
