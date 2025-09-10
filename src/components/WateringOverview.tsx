
"use client";

import * as React from "react"
import Link from 'next/link';
import Image from 'next/image';
import { addDays, formatDistanceToNowStrict, isAfter } from 'date-fns';
import type { Plant } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Droplets } from "lucide-react";

const Countdown = ({ targetDate }: { targetDate: Date }) => {
    const [now, setNow] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000 * 60); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const totalSeconds = (targetDate.getTime() - now.getTime()) / 1000;

    if (totalSeconds <= 0) {
        return <span className="font-bold text-destructive">Overdue!</span>;
    }
    
    return <span>{formatDistanceToNowStrict(targetDate)}</span>;
};


function WateringCard({ plant }: { plant: Plant }) {
    if (!plant.wateringFrequency) return null;

    const nextWateringDate = addDays(new Date(plant.lastWatered), plant.wateringFrequency);
    const isOverdue = isAfter(new Date(), nextWateringDate);

    return (
        <CarouselItem className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
          <Link href={`/plant/${plant.id}`} className="group block h-full">
            <Card className={cn(
                "h-full transition-all group-hover:shadow-md",
                 isOverdue && "bg-destructive/10 border-destructive"
            )}>
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 relative rounded-full overflow-hidden mb-3 border-2 border-muted">
                    <Image
                      src={plant.photoUrl}
                      alt={plant.customName}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                 </div>
                 <p className="font-semibold text-sm truncate w-full">{plant.customName}</p>
                 <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                     <Droplets className="w-3 h-3"/>
                     <Countdown targetDate={nextWateringDate} />
                 </div>
              </CardContent>
            </Card>
          </Link>
        </CarouselItem>
    )
}

interface WateringOverviewProps {
    plants: Plant[];
}

export function WateringOverview({ plants }: WateringOverviewProps) {
    const plantsWithSchedule = plants.filter(p => p.wateringFrequency);

    if (plantsWithSchedule.length === 0) {
        return null;
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Watering Schedule Overview</CardTitle>
                <CardDescription>A quick look at when your plants need water next.</CardDescription>
            </CardHeader>
            <CardContent>
                <Carousel
                    opts={{
                        align: "start",
                        dragFree: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent>
                        {plantsWithSchedule.map(plant => (
                            <WateringCard key={plant.id} plant={plant} />
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex" />
                    <CarouselNext className="hidden sm:flex" />
                </Carousel>
            </CardContent>
        </Card>
    );
}
