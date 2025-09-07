
"use client";

import Link from "next/link";
import Image from "next/image";
import { PlusCircle, Bot, Info, Loader2, RefreshCw } from "lucide-react";
import { addDays, isAfter } from "date-fns";
import { usePlantStore } from "@/hooks/use-plant-store";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { getGardenOverview } from "@/ai/flows/get-garden-overview";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

function LeafIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 4 13V8a5 5 0 0 1 10 0v5a7 7 0 0 1-7 7Z" />
      <path d="M20.34 10.66A5 5 0 0 0 14 5V2" />
    </svg>
  )
}

function GardenOverview() {
  const { plants, isInitialized: isPlantsInitialized } = usePlantStore();
  const { settings, isInitialized: isSettingsInitialized } = useSettingsStore();
  const [overview, setOverview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    
    // Client-side cache check
    if (!forceRefresh) {
        const cached = localStorage.getItem('garden-overview');
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const isStale = new Date().getTime() - timestamp > 12 * 60 * 60 * 1000; // 12 hours
            if (!isStale) {
                setOverview(data);
                setIsLoading(false);
                return;
            }
        }
    }

    try {
      const plantStatus = plants.map(p => {
        const nextWateringDate = addDays(new Date(p.lastWatered), p.wateringFrequency || 7);
        return {
          customName: p.customName,
          commonName: p.commonName,
          isWateringOverdue: isAfter(new Date(), nextWateringDate),
        };
      });

      const result = await getGardenOverview({
        location: settings.location || "",
        plants: plantStatus,
      });
      setOverview(result.overview);
      // Cache the new data
      localStorage.setItem('garden-overview', JSON.stringify({ data: result.overview, timestamp: new Date().getTime() }));

    } catch (error) {
      console.error("Failed to get garden overview:", error);
      setOverview("Could not load Sage's daily digest at this time.");
    } finally {
      setIsLoading(false);
    }
  }, [plants, settings.location]);

  useEffect(() => {
    if (isPlantsInitialized && isSettingsInitialized) {
        if (plants.length > 0 && settings.location) {
          fetchOverview();
          const intervalId = setInterval(() => fetchOverview(true), 12 * 60 * 60 * 1000); 
          return () => clearInterval(intervalId);
        } else {
            setIsLoading(false);
            setOverview(null);
        }
    }
  }, [isPlantsInitialized, isSettingsInitialized, plants.length, settings.location, fetchOverview]);
  
  if (!isPlantsInitialized || !isSettingsInitialized) {
    return (
        <Card className="mb-6">
            <CardHeader>
                 <div className="flex items-start gap-4">
                    <Bot className="h-6 w-6 text-primary mt-1" />
                    <div>
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                 <div className="mt-4 pl-10">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                 </div>
            </CardHeader>
        </Card>
    )
  }

  if (plants.length === 0) {
      return null;
  }
  
  if (!settings.location) {
     return (
        <Card className="mb-6 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-start gap-4">
                 <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                 <div>
                    <CardTitle className="text-lg text-blue-900 dark:text-blue-200">Get Your Daily Digest</CardTitle>
                    <CardDescription className="text-blue-700 dark:text-blue-300">Set your location in settings to get a personalized daily overview of your garden from Sage.</CardDescription>
                    <Button asChild size="sm" className="mt-2">
                        <Link href="/settings">Go to Settings</Link>
                    </Button>
                 </div>
            </div>
          </CardHeader>
        </Card>
      );
  }

  return (
     <Card className="mb-6 bg-primary/5 dark:bg-primary/10 border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
                <Bot className="h-6 w-6 text-primary mt-1" />
                <div>
                    <CardTitle className="text-lg">Sage's Daily Digest</CardTitle>
                    <CardDescription>Your AI-powered garden overview for today.</CardDescription>
                </div>
            </div>
             <Button variant="ghost" size="icon" onClick={() => fetchOverview(true)} disabled={isLoading} aria-label="Refresh Daily Digest">
                <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isLoading && "animate-spin")} />
            </Button>
        </div>
        <div className="mt-4 text-sm text-foreground pl-10">
        {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Asking Sage for your daily digest...</span>
            </div>
        ) : (
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-strong:text-foreground">
                <ReactMarkdown>{overview || ""}</ReactMarkdown>
            </div>
        )}
        </div>
      </CardHeader>
    </Card>
  )
}

export default function MyPlantsPage() {
  const { plants, isInitialized } = usePlantStore();
  
  const renderContent = () => {
    if (!isInitialized) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-[4/3] w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    if (plants.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plants.map((plant) => (
            <Link href={`/plant/${plant.id}`} key={plant.id} className="group">
              <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/80">
                <CardHeader className="p-0">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={plant.photoUrl}
                      alt={plant.customName}
                      fill
                      className="object-cover"
                      data-ai-hint="plant"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 bg-card">
                  <CardTitle className="text-lg font-semibold font-heading">{plant.customName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plant.commonName}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )
    }

    return (
        <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card">
          <LeafIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Your garden is empty!</h2>
          <p className="text-muted-foreground mt-2 mb-4">Let's add your first plant to get started.</p>
          <Button asChild>
            <Link href="/identify">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Plant
            </Link>
          </Button>
        </div>
      )
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-heading">My Plants</h1>
          <p className="text-muted-foreground">Your digital garden.</p>
        </div>
        <Button asChild>
          <Link href="/identify">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Plant
          </Link>
        </Button>
      </div>
       <GardenOverview />
      {renderContent()}
    </AppLayout>
  );
}

    