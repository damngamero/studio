
"use client";

import { useAchievementStore } from "@/hooks/use-achievement-store";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AchievementsPage() {
  const { achievements, isInitialized } = useAchievementStore();

  const renderContent = () => {
    if (!isInitialized) {
      return (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
           {Array.from({ length: 6 }).map((_, i) => (
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

    return (
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {achievements.map((achievement) => (
          <Card 
            key={achievement.id}
            className={cn(
                "transition-all duration-300",
                achievement.unlocked ? "border-primary/50 shadow-lg" : "bg-muted/50"
            )}
          >
            <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
              <div 
                className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors",
                    achievement.unlocked ? "bg-primary/20 text-primary" : "bg-muted-foreground/20 text-muted-foreground"
                )}
              >
                <achievement.icon className="w-10 h-10" />
              </div>
              <p className="font-bold text-lg font-heading">{achievement.name}</p>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
               {achievement.unlocked && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4"/>
                    <span>Unlocked!</span>
                </div>
              )}
               {!achievement.unlocked && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4"/>
                    <span>Locked</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Achievements</h1>
          <p className="text-muted-foreground">Celebrate your plant care milestones!</p>
        </div>
      </div>
      {renderContent()}
    </AppLayout>
  );
}
