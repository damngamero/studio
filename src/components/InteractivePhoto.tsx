
'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { RegionOfInterest } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


interface InteractivePhotoProps {
  photoDataUri: string;
  regions: RegionOfInterest[];
  plantName: string;
  priority?: boolean;
}

export function InteractivePhoto({
  photoDataUri,
  regions,
  plantName,
  priority = false
}: InteractivePhotoProps) {
  
  return (
    <div className="relative w-full h-full">
      <div className="relative w-full h-full aspect-video">
        <Image
          src={photoDataUri}
          alt={`Interactive view of ${plantName}`}
          fill
          className="object-contain"
          data-ai-hint="plant"
          priority={priority}
        />
        <TooltipProvider>
            {regions.map((region, index) => (
             <Dialog key={index}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <div
                                className={cn(
                                    "absolute border-2 rounded-sm cursor-pointer hover:bg-white/30 transition-colors",
                                    region.description.toLowerCase().includes('healthy') ? 'border-green-500' : 'border-destructive animate-pulse'
                                )}
                                style={{
                                left: `${region.box.x1 * 100}%`,
                                top: `${region.box.y1 * 100}%`,
                                width: `${(region.box.x2 - region.box.x1) * 100}%`,
                                height: `${(region.box.y2 - region.box.y1) * 100}%`,
                                }}
                            />
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="hidden md:block">
                        <p className="font-bold">{region.label}</p>
                        <p>{region.description}</p>
                    </TooltipContent>
                </Tooltip>
                 <DialogContent>
                    <DialogHeader>
                    <DialogTitle>{region.label}</DialogTitle>
                    <DialogDescription>
                        {region.description}
                    </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
            ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
