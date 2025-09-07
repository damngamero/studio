
"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { useAchievementDialogStore } from '@/hooks/use-achievement-dialog-store';
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="rounded-full bg-yellow-400 p-4 w-24 h-24 flex items-center justify-center mb-4 border-8 border-yellow-300/50">
            <achievement.icon className="w-12 h-12 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold font-heading">Achievement Unlocked!</DialogTitle>
          <DialogDescription className="text-lg font-semibold text-foreground">{achievement.name}</DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground">{achievement.description}</p>
        <Button onClick={handleClose} className="mt-4">
            <Award className="mr-2 h-4 w-4" /> Awesome!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
