

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Search } from 'lucide-react';
import type { RegionOfInterest } from '@/lib/types';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface InteractivePhotoProps {
  photoDataUri: string;
  regions: RegionOfInterest[];
  plantName: string;
}

export function InteractivePhoto({
  photoDataUri,
  regions,
  plantName,
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
        />
        <TooltipProvider>
            {regions.map((region, index) => (
            <Tooltip key={index}>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-bold">{region.label}</p>
                    <p>{region.description}</p>
                </TooltipContent>
            </Tooltip>
            ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
