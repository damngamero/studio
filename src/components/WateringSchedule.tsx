
"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Calendar, Droplets, Loader2, Info, ThumbsDown, ThumbsUp, MoreVertical } from 'lucide-react';
import { addDays, format, formatDistanceToNow, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Plant } from '@/lib/types';
import type { GetWateringAdviceOutput } from '@/ai/flows/get-watering-advice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface WateringScheduleProps {
  plant: Plant;
  onWaterPlant: () => void;
  advice: GetWateringAdviceOutput | null;
  isLoadingAdvice: boolean;
  onFeedback: (message: string, waterNow: boolean) => void;
}

const Countdown = ({ targetDate }: { targetDate: Date }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000 * 60); // Update every minute
        return () => clearInterval(timer);
    }, []);
    
    const totalSeconds = (targetDate.getTime() - now.getTime()) / 1000;
    
    if (totalSeconds <= 0) {
        return <span className="text-destructive-foreground font-bold">Overdue!</span>;
    }

    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600*24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return (
        <div className="flex items-baseline justify-center gap-2">
           <span className="text-2xl font-bold">{String(days).padStart(2, '0')}</span>
           <span className="text-sm">d</span>
           <span className="text-2xl font-bold">{String(hours).padStart(2, '0')}</span>
           <span className="text-sm">h</span>
           <span className="text-2xl font-bold">{String(minutes).padStart(2, '0')}</span>
           <span className="text-sm">m</span>
        </div>
    );
};

export function WateringSchedule({ plant, onWaterPlant, advice, isLoadingAdvice, onFeedback }: WateringScheduleProps) {
  const [isWateredToday, setIsWateredToday] = useState(false);

  const { lastWatered, wateringFrequency, wateringTime } = plant;
  
  const lastWateredDate = new Date(lastWatered);
  const regularNextWateringDate = wateringFrequency ? addDays(lastWateredDate, wateringFrequency) : new Date();
  
  // Use AI's suggested time if available and valid
  const nextWateringDate = advice?.newWateringTime ? new Date(advice.newWateringTime) : regularNextWateringDate;
  
  const isOverdue = isAfter(new Date(), nextWateringDate);

  const handleWaterPlantClick = () => {
    onWaterPlant();
    setIsWateredToday(true);
  };
  
  useEffect(() => {
      setIsWateredToday(false);
  }, [lastWatered]);

  if (!wateringFrequency) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Calendar /> Watering Schedule</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Generate care tips from Sage to get a personalized watering schedule.</p>
            </CardContent>
        </Card>
    );
  }

  const renderContent = () => {
    if (isLoadingAdvice) {
      return (
        <div className="flex flex-col items-center justify-center space-y-2 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Asking Sage for weather-based advice...</span>
        </div>
      );
    }
    
    if (isOverdue && advice?.shouldWater !== 'Wait') {
       return (
         <CardContent className="space-y-4 text-center">
            {advice?.reason && (
              <div className="text-sm p-2 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-md flex items-center gap-2 justify-center">
                <Info className="h-4 w-4"/>
                <p>{advice.reason}</p>
              </div>
            )}
            <Button 
                onClick={handleWaterPlantClick} 
                className="w-full"
                disabled={isWateredToday}
            >
              <Droplets className="mr-2" /> 
              {isWateredToday ? 'Watered!' : 'Mark as Watered'}
            </Button>
         </CardContent>
       )
    }

    // Default view: countdown, which now uses AI time if available
    return (
       <CardContent className="space-y-4 text-center">
        <div className="text-4xl font-bold">
            <Countdown targetDate={nextWateringDate} />
        </div>
        <p className="text-xs text-muted-foreground">
            Last watered {formatDistanceToNow(lastWateredDate)} ago
        </p>
        <Button 
            onClick={handleWaterPlantClick} 
            className="w-full"
            disabled={true}
        >
          <Droplets className="mr-2" /> 
          It's not time yet
        </Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    Something's wrong?
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                 <DropdownMenuItem onSelect={() => onFeedback("The soil is dry, so I'm watering it now even though the schedule says not to.", true)}>
                    <ThumbsUp className="mr-2 h-4 w-4 text-green-500" />
                    <span>It's dry, watering now</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onFeedback("The soil is still wet, so I'm skipping this watering.", false)}>
                    <ThumbsDown className="mr-2 h-4 w-4 text-red-500" />
                    <span>It's wet, skipping</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    );
  };
  
  const getCardClass = () => {
    if (isOverdue && advice?.shouldWater !== 'Wait' && !isWateredToday) return 'bg-green-100/50 dark:bg-green-900/50 border-green-500/50';
    if (advice?.shouldWater === 'Wait') return 'bg-blue-100/50 dark:bg-blue-900/50 border-blue-500/50';
    return '';
  }

  const getWateringDescription = () => {
    if (advice?.shouldWater === 'Wait') {
        return advice.reason;
    }
    
    if (isOverdue) {
        return "Watering is overdue.";
    }

    let description = "The timer shows minimum wait time till watering.";
    if (wateringTime) {
        description += `\nRecommended: ${wateringTime}.`;
    }
    
    return description;
  }

  return (
    <Card className={cn("transition-colors duration-500", getCardClass())}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
            <Calendar /> Watering Schedule
        </CardTitle>
        <CardDescription className="whitespace-pre-line">
          {getWateringDescription()}
        </CardDescription>
      </CardHeader>
      {renderContent()}
    </Card>
  );
}
