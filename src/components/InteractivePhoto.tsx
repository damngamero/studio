'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Search } from 'lucide-react';
import {
  diagnosePlantWithRegions,
  type RegionOfInterest,
} from '@/ai/flows/diagnose-plant-with-regions';
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
  plantName: string;
}

export function InteractivePhoto({
  photoDataUri,
  plantName,
}: InteractivePhotoProps) {
  const { toast } = useToast();
  const [regions, setRegions] = useState<RegionOfInterest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnose = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await diagnosePlantWithRegions({ photoDataUri });
      setRegions(result.regions);
      if (result.regions.length === 0) {
        toast({
          title: 'All Clear!',
          description: 'The AI did not find any specific regions to highlight.',
        });
      }
    } catch (e) {
      console.error(e);
      setError('An error occurred during diagnosis.');
      toast({
        variant: 'destructive',
        title: 'Diagnosis Failed',
        description:
          'Could not analyze the plant photo. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Automatically run diagnosis when the component mounts
  useEffect(() => {
    handleDiagnose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoDataUri]);

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

      <div className="absolute top-2 right-2 flex items-center gap-2">
        {isLoading && (
          <Badge variant="secondary" className="p-2">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Analyzing...
          </Badge>
        )}
        <Button onClick={handleDiagnose} size="sm" variant="secondary" disabled={isLoading}>
          <Search className="mr-2 h-4 w-4" />
          Re-Analyze
        </Button>
      </div>
      {error && <p className="absolute bottom-2 left-2 text-destructive bg-background/80 p-2 rounded-md">{error}</p>}
    </div>
  );
}
