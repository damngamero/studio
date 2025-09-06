
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Calendar, Droplets } from 'lucide-react';
import { addDays, differenceInDays, differenceInHours, format, formatDistanceToNowStrict, isAfter } from 'date-fns';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { cn } from '@/lib/utils';

interface WateringScheduleProps {
  lastWatered?: string;
  wateringFrequency?: number;
  wateringTime?: string;
  onWaterPlant: () => void;
}

const Countdown = ({ targetDate }: { targetDate: Date }) => {
    const { settings } = useSettingsStore();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000 * 60); // Update every minute
        return () => clearInterval(timer);
    }, []);
    
    // This is a naive implementation, a proper library should be used for timezone-aware calculations
    const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: settings.timezone || 'UTC' }));
    
    const days = differenceInDays(targetDate, nowInTimezone);
    const hours = differenceInHours(targetDate, nowInTimezone) % 24;
    
    if (days < 0) {
        return <span className="text-destructive-foreground font-bold">Overdue!</span>;
    }

    return (
        <div className="flex items-baseline gap-2">
           <span className="text-2xl font-bold">{days}</span>
           <span className="text-sm">d</span>
           <span className="text-2xl font-bold">{hours}</span>
           <span className="text-sm">h</span>
        </div>
    );
};

export function WateringSchedule({ lastWatered, wateringFrequency, wateringTime, onWaterPlant }: WateringScheduleProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isWatered, setIsWatered] = useState(false);
  
  if (!wateringFrequency || !lastWatered) {
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

  const lastWateredDate = new Date(lastWatered);
  const nextWateringDate = addDays(lastWateredDate, wateringFrequency);
  const isOverdue = isAfter(new Date(), nextWateringDate);
  const isButtonDisabled = isWatered || !isOverdue;

  useEffect(() => {
    if (isOverdue && !isWatered) {
      audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isOverdue, isWatered]);

  const handleWaterPlantClick = () => {
    onWaterPlant();
    setIsWatered(true);
    if(audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
  };
  
  // Reset isWatered state when the next watering cycle begins
  useEffect(() => {
      if(!isOverdue) {
          setIsWatered(false);
      }
  }, [isOverdue])

  return (
    <Card className={cn(isOverdue && !isWatered ? 'bg-destructive/80 text-destructive-foreground animate-pulse' : '')}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
            <Calendar /> Watering Schedule
        </CardTitle>
        <CardDescription className={cn(isOverdue && !isWatered ? 'text-destructive-foreground/80' : '')}>
            Next watering due on {format(nextWateringDate, "MMMM do")}
            {wateringTime && ` in the ${wateringTime}`}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <div className="text-4xl font-bold">
            <Countdown targetDate={nextWateringDate} />
        </div>
        <p className={`text-xs ${isOverdue && !isWatered ? 'text-destructive-foreground/80' : 'text-muted-foreground'}`}>
            Last watered {formatDistanceToNowStrict(lastWateredDate)} ago
        </p>
        <Button 
            onClick={handleWaterPlantClick} 
            className="w-full"
            disabled={isButtonDisabled}
            variant={isOverdue && !isWatered ? 'secondary' : 'default'}>
          <Droplets className="mr-2" /> 
          {isWatered ? 'Watered!' : 'Mark as Watered'}
        </Button>
      </CardContent>
      <audio ref={audioRef} loop src="https://assets.mixkit.co/sfx/preview/mixkit-facility-alarm-904.mp3" />
    </Card>
  );
}
