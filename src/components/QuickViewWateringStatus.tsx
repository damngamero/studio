
"use client";

import { Droplets } from 'lucide-react';
import type { Plant } from '@/lib/types';
import type { GetWateringAdviceOutput } from '@/ai/flows/get-watering-advice';
import { addDays, formatDistanceToNow, isAfter } from 'date-fns';

interface QuickViewWateringStatusProps {
    plant: Plant;
    advice: GetWateringAdviceOutput | null;
}

export function QuickViewWateringStatus({ plant, advice }: QuickViewWateringStatusProps) {
    if (!plant.wateringFrequency) {
        return (
            <li className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Droplets className="h-4 w-4" /> Watering</span>
                <span>~ Every ? days</span>
            </li>
        );
    }
    
    const nextWateringDate = addDays(new Date(plant.lastWatered), plant.wateringFrequency);

    let statusText: React.ReactNode = `in ${formatDistanceToNow(nextWateringDate)}`;

    if (isAfter(new Date(), nextWateringDate)) {
        statusText = <span className="font-bold text-destructive">Overdue</span>;
    }
    
    if (advice) {
        if (advice.shouldWater === 'Yes') {
            statusText = <span className="font-bold text-green-600">Water now</span>;
        } else if (advice.shouldWater === 'Wait') {
            statusText = <span className="font-bold text-blue-600">Wait</span>;
        }
    }


    return (
        <li className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2"><Droplets className="h-4 w-4" /> Watering</span>
            <span>{statusText}</span>
        </li>
    );
}

    