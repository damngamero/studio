
"use client";

import { useAchievementStore } from "@/hooks/use-achievement-store";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Rarity } from "@/hooks/use-achievement-store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const rarityStyles: Record<Rarity, { badge: string; border: string; bg: string; icon: string }> = {
    Common: {
        badge: "bg-gray-200 text-gray-800 border-gray-300",
        border: "border-gray-200",
        bg: "bg-gray-50",
        icon: "bg-gray-100 text-gray-600"
    },
    Uncommon: {
        badge: "bg-green-200 text-green-800 border-green-300",
        border: "border-green-500/50",
        bg: "bg-green-50/50",
        icon: "bg-green-100 text-green-600"
    },
    Rare: {
        badge: "bg-blue-200 text-blue-800 border-blue-300",
        border: "border-blue-500/50",
        bg: "bg-blue-50/50",
        icon: "bg-blue-100 text-blue-600"
    },
    Epic: {
        badge: "bg-purple-200 text-purple-800 border-purple-300",
        border: "border-purple-500/50",
        bg: "bg-purple-50/50",
        icon: "bg-purple-100 text-purple-600"
    },
    Legendary: {
        badge: "bg-yellow-200 text-yellow-800 border-yellow-300",
        border: "border-yellow-500/50",
        bg: "bg-yellow-50/50",
        icon: "bg-yellow-100 text-yellow-600"
    },
};

export default function AchievementsPage() {
  const { achievements, isInitialized } = useAchievementStore();
  const [mounted, setMounted] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  useEffect(() => setMounted(true), []);

  const filteredAchievements = showCompleted ? achievements : achievements.filter(a => !a.unlocked);


  const renderContent = () => {
    if (!mounted || !isInitialized) {
      return (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
           {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
                <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                    <Skeleton className="w-20 h-20 rounded-full mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                </CardContent>
            </Card>
          ))}
         </div>
      );
    }
    
    if (filteredAchievements.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card">
                <h2 className="mt-4 text-xl font-semibold">No Achievements to Show</h2>
                <p className="text-muted-foreground mt-2 mb-4">
                    {showCompleted ? "You haven't unlocked any achievements yet. Go explore!" : "All achievements are unlocked! Or you've hidden them."}
                </p>
            </div>
        )
    }

    return (
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredAchievements.map((achievement) => (
          <Card 
            key={achievement.id}
            className={cn(
                "transition-all duration-300 flex flex-col",
                achievement.unlocked ? `${rarityStyles[achievement.rarity].border} shadow-lg ${rarityStyles[achievement.rarity].bg}` : "bg-muted/50"
            )}
          >
            <CardContent className="p-6 text-center flex flex-col items-center justify-center flex-grow">
              <div 
                className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors",
                    achievement.unlocked ? rarityStyles[achievement.rarity].icon : "bg-muted-foreground/20 text-muted-foreground"
                )}
              >
                <achievement.icon className="w-10 h-10" />
              </div>
              <p className="font-bold text-lg font-heading">{achievement.name}</p>
              <div className="text-sm text-muted-foreground flex-grow">{achievement.description}</div>
            </CardContent>
            <div className="p-4 pt-0 flex flex-col items-center">
                 <Badge
                    variant="outline"
                    className={cn(
                        "mb-3",
                        achievement.unlocked ? rarityStyles[achievement.rarity].badge : 'border-muted-foreground/50'
                    )}
                 >
                    {achievement.rarity}
                </Badge>
               {achievement.unlocked ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4"/>
                    <span>Unlocked!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4"/>
                    <span>Locked</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-6 gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-heading">Achievements</h1>
          <p className="text-muted-foreground">Celebrate your plant care milestones!</p>
        </div>
        <div className="flex items-center space-x-2">
            <Switch 
                id="show-completed" 
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
            />
            <Label htmlFor="show-completed" className="text-sm">Show Completed</Label>
        </div>
      </div>
      {renderContent()}
    </AppLayout>
  );
}
