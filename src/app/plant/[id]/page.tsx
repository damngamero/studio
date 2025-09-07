
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Trash2, Bot, Loader2, MessageSquare, Leaf, Droplets, Sun, Stethoscope, Camera, X, MapPin, AlertTriangle, Info, CloudSun, BookOpen, RefreshCw, Search, Home, Wind, Waves, ThumbsUp, ThumbsDown } from "lucide-react";
import { addDays, format, formatDistanceToNow, isAfter, intervalToDuration } from 'date-fns';


import { usePlantStore } from "@/hooks/use-plant-store";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { useAchievementStore } from "@/hooks/use-achievement-store.tsx";
import { getPlantCareTips } from "@/ai/flows/get-plant-care-tips";
import { checkPlantHealth } from "@/ai/flows/check-plant-health";
import { getWeatherAndPlantAdvice } from "@/ai/flows/get-weather-and-plant-advice";
import { getWateringAdvice } from "@/ai/flows/get-watering-advice";
import { chatAboutPlant } from "@/ai/flows/chat-about-plant";
import { getPlantPlacement } from "@/ai/flows/get-plant-placement";
import { getPlacementFeedback } from "@/ai/flows/get-placement-feedback";
import { recalculateWateringSchedule } from "@/ai/flows/recalculate-watering-schedule";
import type { GetWateringAdviceOutput } from '@/ai/flows/get-watering-advice';
import type { Plant } from "@/lib/types";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Chat } from "@/components/Chat";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WateringSchedule } from "@/components/WateringSchedule";
import { InteractivePhoto } from "@/components/InteractivePhoto";
import { DialogDescription } from "@/components/ui/dialog";
import { PlantJournal } from "@/components/PlantJournal";
import ReactMarkdown from "react-markdown";
import { QuickViewWateringStatus } from "@/components/QuickViewWateringStatus";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

interface PlantPageData {
  weatherAdvice: string | null;
  wateringAdvice: GetWateringAdviceOutput | null;
}

export default function PlantProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { getPlantById, deletePlant, updatePlant } = usePlantStore();
  const { settings } = useSettingsStore();
  const { checkAndUnlock } = useAchievementStore();
  const { toast } = useToast();
  
  const [plant, setPlant] = useState<Plant | null | undefined>(undefined);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isHealthCheckModalOpen, setIsHealthCheckModalOpen] = useState(false);
  const [healthCheckPhoto, setHealthCheckPhoto] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isGeneratingTips, setIsGeneratingTips] = useState(false);
  const [isSettingPlacement, setIsSettingPlacement] = useState<"Indoor" | "Outdoor" | false>(false);
  const [healthCheckCount, setHealthCheckCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [pageData, setPageData] = useState<PlantPageData>({ weatherAdvice: null, wateringAdvice: null });
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>(undefined);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const plantId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  useEffect(() => {
    setIsApiKeyMissing(!settings.geminiApiKey);
  }, [settings.geminiApiKey]);

  useEffect(() => {
    if (plantId) {
      const foundPlant = getPlantById(plantId);
      setPlant(foundPlant);
    }
  }, [plantId, getPlantById]);

  const fetchPageData = useCallback(async (currentPlant: Plant, forceRefresh = false) => {
    if (!settings.location || isApiKeyMissing) {
      setIsPageLoading(false);
      return;
    }

    setIsPageLoading(true);
    const cacheKey = `plant-page-data-${currentPlant.id}`;

    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isStale = new Date().getTime() - timestamp > 6 * 60 * 60 * 1000; // 6 hours
        if (!isStale) {
          setPageData(data);
          setIsPageLoading(false);
          return;
        }
      }
    }

    try {
      const promises: Promise<any>[] = [];
      const nextWateringDate = addDays(new Date(currentPlant.lastWatered), currentPlant.wateringFrequency || 7);
      const isWateringOverdue = isAfter(new Date(), nextWateringDate);

      // Fetch weather and plant advice
      promises.push(getWeatherAndPlantAdvice({
        location: settings.location,
        plants: [{ customName: currentPlant.customName, commonName: currentPlant.commonName, placement: currentPlant.placement }]
      }));
      
      // Fetch watering advice only if it's overdue
      if (isWateringOverdue) {
        promises.push(getWateringAdvice({
          plantName: currentPlant.customName,
          plantCommonName: currentPlant.commonName,
          location: settings.location,
          isWateringOverdue: true,
          placement: currentPlant.placement,
        }));
      } else {
        promises.push(Promise.resolve(null));
      }

      const [weatherResult, wateringResult] = await Promise.all(promises);

      const newData = {
        weatherAdvice: weatherResult.plantAdvice.length > 0 ? weatherResult.plantAdvice[0].advice : "Could not fetch weather advice.",
        wateringAdvice: wateringResult
      };

      setPageData(newData);
      localStorage.setItem(cacheKey, JSON.stringify({ data: newData, timestamp: new Date().getTime() }));

    } catch (error) {
      console.error("Failed to fetch page data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load AI-powered advice. Please try again later.",
      });
    } finally {
      setIsPageLoading(false);
    }
  }, [settings.location, isApiKeyMissing, toast]);

  useEffect(() => {
    if (plant) {
        fetchPageData(plant, false);
    }
  }, [plant, fetchPageData]);

  const onChatInteraction = (updatedPlantData: Partial<Plant>) => {
    if (!plant) return;
    const updatedPlant = { ...plant, ...updatedPlantData };
    updatePlant(updatedPlant);
    setPlant(updatedPlant);
    toast({
        title: "Care Tip Updated!",
        description: "Sage has updated the watering advice for this plant.",
    })
  };

  const handleWaterPlant = () => {
    if (!plant || !plant.wateringFrequency) return;

    const nextWateringDate = addDays(new Date(plant.lastWatered), plant.wateringFrequency);
    const now = new Date();
    const isOverdue = isAfter(now, nextWateringDate);

    // If watering was overdue, trigger the AI schedule recalculation
    if (isOverdue) {
        const duration = intervalToDuration({ start: nextWateringDate, end: now });
        const timeLate = `${duration.days || 0} days, ${duration.hours || 0} hours`;
        const feedbackMessage = `Watering was ${timeLate} late, but the plant seemed fine.`;
        
        // Update last watered date immediately for UI responsiveness
        const updatedPlant = { ...plant, lastWatered: now.toISOString() };
        updatePlant(updatedPlant);
        setPlant(updatedPlant);
        toast({
            title: "Plant Watered!",
            description: `Nice work! ${plant.customName} has been watered.`,
        });

        // Silently ask AI to review the schedule
        recalculateWateringSchedule({
            plantCommonName: plant.commonName,
            currentWateringFrequency: plant.wateringFrequency,
            feedback: feedbackMessage,
            timingDiscrepancy: `${timeLate} late`,
            location: settings.location || '',
            environmentNotes: plant.environmentNotes,
        }).then(result => {
            if (result.newWateringFrequency !== plant.wateringFrequency) {
                const aiUpdatedPlant = {
                    ...updatedPlant,
                    wateringFrequency: result.newWateringFrequency,
                };
                updatePlant(aiUpdatedPlant);
                setPlant(aiUpdatedPlant);
                toast({
                    title: 'Schedule Adjusted by Sage!',
                    description: result.reasoning
                });
            }
        }).catch(e => {
            console.error("Failed to recalculate schedule after late watering", e);
            // Don't bother the user with an error, the watering is already logged.
        });

    } else {
         // If not overdue, just update the date
        const updatedPlant = { ...plant, lastWatered: new Date().toISOString() };
        updatePlant(updatedPlant);
        setPlant(updatedPlant);
        toast({
          title: "Plant Watered!",
          description: `Nice work! ${plant.customName} has been watered.`,
        });
    }
  };

  const handleFeedback = async (message: string, waterNow: boolean) => {
    if (!plant || !plant.wateringFrequency) return;
    
    toast({
        title: "Sending feedback to Sage...",
        description: "Updating your schedule based on your feedback.",
    });

    try {
        if (waterNow) { // "It's dry, watering now"
            const nextWateringDate = addDays(new Date(plant.lastWatered), plant.wateringFrequency);
            const now = new Date();
            const duration = intervalToDuration({ start: now, end: nextWateringDate });
            const timeEarly = `${duration.days || 0} days, ${duration.hours || 0} hours`;

            const result = await recalculateWateringSchedule({
                plantCommonName: plant.commonName,
                currentWateringFrequency: plant.wateringFrequency,
                feedback: message,
                timingDiscrepancy: `${timeEarly} early`,
                location: settings.location || '',
                environmentNotes: plant.environmentNotes,
            });

            const updatedPlant = {
                ...plant, 
                wateringFrequency: result.newWateringFrequency,
                lastWatered: new Date().toISOString(), // Mark as watered now
            };
            updatePlant(updatedPlant);
            setPlant(updatedPlant);
            toast({
                title: 'Schedule Adjusted!',
                description: result.reasoning
            });
        } else { // "It's wet, skipping"
             const result = await recalculateWateringSchedule({
                plantCommonName: plant.commonName,
                currentWateringFrequency: plant.wateringFrequency,
                feedback: message,
                timingDiscrepancy: `skipping`,
                location: settings.location || '',
                environmentNotes: plant.environmentNotes,
            });

            const updatedPlant = {
                ...plant,
                wateringFrequency: result.newWateringFrequency,
                // DO NOT update lastWatered date
            };
            updatePlant(updatedPlant);
            setPlant(updatedPlant);
            toast({
                title: 'Schedule Adjusted!',
                description: result.reasoning
            });
        }
    } catch (e) {
        console.error("Failed to recalculate schedule with feedback", e);
        toast({
            variant: 'destructive',
            title: 'AI Update Failed',
            description: "Couldn't connect with Sage to adjust the schedule. Please try again."
        });
    }
  };
  
  const handleRegenerateTips = useCallback(async (plantToUpdate: Plant) => {
    if (!plantToUpdate) return;
    setIsGeneratingTips(true);
    try {
       const tipsResult = await getPlantCareTips({ 
          plantSpecies: plantToUpdate.commonName,
          environmentNotes: plantToUpdate.environmentNotes,
          lastWatered: plantToUpdate.lastWatered,
          estimatedAge: plantToUpdate.estimatedAge,
          location: settings.location,
          placement: plantToUpdate.placement,
        });

      const updatedPlantData = { 
        ...plantToUpdate, 
        careTips: tipsResult.careTips,
        wateringFrequency: tipsResult.wateringFrequency,
        wateringTime: tipsResult.wateringTime,
        wateringAmount: tipsResult.wateringAmount,
      };
      updatePlant(updatedPlantData);
      setPlant(updatedPlantData);
      toast({
        title: 'Care Tips Updated',
        description: 'Sage has provided new care recommendations based on the latest info.'
      })
    } catch (error) {
        console.error("Failed to regenerate care tips:", error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not regenerate care tips. Please try again later.",
        });
    } finally {
        setIsGeneratingTips(false);
    }
  }, [settings.location, updatePlant, toast]);

const handleSetPlacement = useCallback(async (newPlacement: 'Indoor' | 'Outdoor') => {
    if (!plant || plant.placement === newPlacement || isSettingPlacement) return;

    setIsSettingPlacement(newPlacement);

    try {
        let plantStateForTips = { ...plant, placement: newPlacement };

        // Only fetch feedback if it's the first time for this placement
        if (!plant.placementFeedback?.[newPlacement]) {
            const feedbackResult = await getPlacementFeedback({
                plantSpecies: plant.commonName,
                recommendedPlacement: plant.recommendedPlacement || 'Indoor/Outdoor',
                userChoice: newPlacement,
                location: settings.location,
            });
            
            toast({
                variant: feedbackResult.isGoodChoice ? 'default' : 'destructive',
                title: feedbackResult.isGoodChoice ? 'Good Choice!' : 'Heads Up!',
                description: feedbackResult.feedback,
            });
            
            // Add the new feedback to the plant state
             plantStateForTips.placementFeedback = {
                ...(plant.placementFeedback || {}),
                [newPlacement]: feedbackResult.feedback
            };
        }
        
        // This is the critical step: update the state for the UI, then regenerate tips.
        updatePlant(plantStateForTips);
        setPlant(plantStateForTips); 
        await handleRegenerateTips(plantStateForTips);

    } catch (error) {
        console.error("Failed to set placement:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not get new feedback or tips for the updated placement.",
        });
    } finally {
        setIsSettingPlacement(false);
    }
}, [plant, updatePlant, toast, handleRegenerateTips, isSettingPlacement, settings.location]);

  const stopCameraStream = useCallback(() => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }, []);

  useEffect(() => {
    if (isHealthCheckModalOpen) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
        }
      };

      getCameraPermission();
      
      return () => {
        stopCameraStream();
      }
    }
  }, [isHealthCheckModalOpen, stopCameraStream]);

  const handleCaptureHealthPhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL("image/jpeg");
        setHealthCheckPhoto(dataUri);
        stopCameraStream();
      }
    }
  };

  const handleOpenChat = (context?: string) => {
    setChatContext(context);
    setIsChatOpen(true);
  };

  const handleCheckHealth = async () => {
    if (!plant || !healthCheckPhoto) {
       toast({
        variant: "destructive",
        title: "No Photo",
        description: "Please take a photo for the health check.",
      });
      return;
    }
    setIsCheckingHealth(true);
    try {
      const healthResult = await checkPlantHealth({ 
        photoDataUri: healthCheckPhoto,
        notes: plant.notes,
        currentCommonName: plant.commonName,
      });

      let updatedPlant: Plant = { 
        ...plant,
        health: {isHealthy: healthResult.isHealthy, diagnosis: healthResult.diagnosis},
        annotatedRegions: healthResult.regions, 
        photoUrl: healthCheckPhoto 
      };

      // Check if the species was re-identified with high confidence and is different
      if (healthResult.confidence > 0.75 && healthResult.commonName !== plant.commonName) {
        toast({
          title: "Species Re-identified!",
          description: `Sage thinks this is a ${healthResult.commonName}, not a ${plant.commonName}. The profile has been updated.`
        });
        updatedPlant.commonName = healthResult.commonName;
        updatedPlant.latinName = healthResult.latinName;
      }
      
      updatePlant(updatedPlant);
      setPlant(updatedPlant);
      toast({
        title: "Health Check Complete!",
        description: "Sage has assessed your plant's health.",
      });

      // If the species was updated, we should also regenerate the care tips
      if (updatedPlant.commonName !== plant.commonName) {
        await handleRegenerateTips(updatedPlant);
      }

      const newHealthCheckCount = healthCheckCount + 1;
      setHealthCheckCount(newHealthCheckCount);
      checkAndUnlock(['first_diagnosis'], newHealthCheckCount);

    } catch (error) {
      console.error("Failed to check health:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not complete health check. Please try again.",
      });
    } finally {
      setIsCheckingHealth(false);
      setIsHealthCheckModalOpen(false);
      setHealthCheckPhoto(null);
    }
  };


  const handleDelete = () => {
    if (plant) {
      deletePlant(plant.id);
      toast({
        title: "Plant Removed",
        description: `${plant.customName} has been removed from your garden.`,
      });
      router.push("/");
    }
  };

  if (plant === undefined) {
    return <AppLayout><div className="max-w-4xl mx-auto"><Skeleton className="w-full h-96" /></div></AppLayout>;
  }

  if (plant === null) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold">Plant not found</h1>
          <p className="text-muted-foreground">The plant you are looking for does not exist.</p>
          <Button asChild className="mt-4">
            <Link href="/">Back to My Plants</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const displayName = plant.displayNameFormat === 'latin' ? plant.latinName : plant.commonName;

  return (
    <AppLayout>
      <div className="mx-auto grid max-w-5xl flex-1 auto-rows-max gap-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            {plant.customName}
          </h1>
           <Badge variant="outline" className="ml-auto sm:ml-0">
            {displayName}
          </Badge>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button variant="outline" size="sm" asChild>
                <Link href={`/plant/${plant.id}/edit`}>
                  <Pencil className="mr-2 h-3 w-3" /> Edit
                </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-3 w-3" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{plant.customName}" from your garden. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="grid auto-rows-max items-start gap-6">
            <Card>
              <CardContent className="p-4">
                 <div className="relative aspect-video w-full rounded-md overflow-hidden shadow-md mb-6">
                  <InteractivePhoto photoDataUri={plant.photoUrl} regions={plant.annotatedRegions || []} plantName={plant.customName} />
                </div>
                 {plant.notes && (
                    <div>
                      <h3 className="font-semibold text-base mb-2">My Notes</h3>
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground">{plant.notes}</p>
                    </div>
                  )}
              </CardContent>
            </Card>
             <Card>
               <CardHeader>
                <CardTitle className="text-xl">Sage's Assistant</CardTitle>
                <CardDescription>Get care tips, check health, and chat about your plant.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isApiKeyMissing && (
                   <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>API Key Required</AlertTitle>
                      <AlertDescription>
                        Set your Gemini API Key in settings to enable Sage's AI features.
                         <Button asChild variant="link" className="p-0 h-auto ml-1 font-semibold">
                           <Link href="/settings">Go to Settings</Link>
                         </Button>
                      </AlertDescription>
                   </Alert>
                )}
                <div>
                  <h4 className="font-medium text-sm mb-2">AI Health Check</h4>
                   {plant.health ? (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Status:</span> 
                        <Badge variant={plant.health.isHealthy ? 'default' : 'destructive'}>
                          {plant.health.isHealthy ? 'Healthy' : 'Needs Attention'}
                        </Badge>
                      </div>
                      <p className="whitespace-pre-wrap"><span className="font-semibold">Diagnosis:</span> {plant.health.diagnosis}</p>
                       <Button variant="link" size="sm" className="p-0 h-auto mt-1" disabled={isApiKeyMissing} onClick={() => handleOpenChat(plant.health?.diagnosis)}>
                          <MessageSquare className="mr-2 h-3.5 w-3.5"/> Discuss Diagnosis
                       </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No health check performed yet.</p>
                  )}
                   <Dialog open={isHealthCheckModalOpen} onOpenChange={setIsHealthCheckModalOpen}>
                      <DialogTrigger asChild>
                         <Button variant="outline" size="sm" className="mt-3" disabled={isApiKeyMissing}>
                            <Stethoscope className="mr-2 h-4 w-4" /> {plant.health ? 'Re-check Health' : 'Check Health'}
                         </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Plant Health Check</DialogTitle>
                           <DialogDescription>Take a new photo of your plant. Sage will analyze it for overall health and identify any problem areas.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 my-4">
                           <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden relative">
                            {healthCheckPhoto ? (
                                <Image src={healthCheckPhoto} alt="Health check photo" fill className="object-contain" />
                            ) : (
                              <>
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                {hasCameraPermission === false && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <p className="text-white text-center text-xs p-2">Camera access denied.</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 justify-center">
                              <Button onClick={handleCaptureHealthPhoto} disabled={!hasCameraPermission || !!healthCheckPhoto}>
                                <Camera className="mr-2" /> Capture
                              </Button>
                              <Button variant="outline" onClick={() => setHealthCheckPhoto(null)} disabled={!healthCheckPhoto}>
                                <X className="mr-2" /> Retake
                              </Button>
                          </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                            <Button onClick={handleCheckHealth} disabled={isCheckingHealth || !healthCheckPhoto}>
                              {isCheckingHealth ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Stethoscope className="mr-2 h-4 w-4" />
                              )}
                              Analyze Photo
                            </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                </div>
                <Separator />
                 <div>
                    <div className="flex items-start justify-between mb-2">
                        <div>
                         <h4 className="font-medium text-sm">Sage's General Care Tips</h4>
                         {plant.wateringAmount && <p className="text-xs text-muted-foreground">Recommended water: {plant.wateringAmount}</p>}
                        </div>
                         <Button variant="outline" size="xs" onClick={() => handleRegenerateTips(plant)} disabled={isGeneratingTips || isApiKeyMissing}>
                            {isGeneratingTips ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <RefreshCw className="mr-2 h-3 w-3" />}
                            Regenerate
                        </Button>
                    </div>
                    {isGeneratingTips ? (
                       <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    ) : plant.careTips ? (
                      <Accordion type="single" collapsible defaultValue="item-1">
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="text-sm">View Care Tips</AccordionTrigger>
                          <AccordionContent>
                            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                                <ReactMarkdown>{plant.careTips}</ReactMarkdown>
                            </div>
                            <Button variant="link" size="sm" className="p-0 h-auto mt-2" disabled={isApiKeyMissing} onClick={() => handleOpenChat(plant.careTips)}>
                                <MessageSquare className="mr-2 h-3.5 w-3.5"/> Discuss Tips
                            </Button>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      <p className="text-sm text-muted-foreground">No care tips generated yet.</p>
                    )}
                 </div>
              </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">Proactive Weather Tips</CardTitle>
                        <CardDescription>Sage's advice based on local weather.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => fetchPageData(plant, true)} disabled={isPageLoading} aria-label="Refresh Weather Tips">
                        <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isPageLoading && "animate-spin")} />
                    </Button>
                </CardHeader>
                <CardContent>
                    {isPageLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    ) : settings.location ? (
                         pageData.weatherAdvice ? (
                           <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-strong:text-foreground">
                                <ReactMarkdown>{pageData.weatherAdvice}</ReactMarkdown>
                           </div>
                         ) : (
                            <p className="text-sm text-muted-foreground">Could not load weather advice.</p>
                         )
                    ) : (
                        <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg flex flex-col items-center justify-center text-center gap-3">
                            <Info className="h-8 w-8"/>
                            <span>Set your location in settings to receive proactive weather advice.</span>
                            <Button asChild size="sm" className="mt-2">
                               <Link href="/settings">Go to Settings</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>
          <div className="grid auto-rows-max items-start gap-6">
             <WateringSchedule 
                plant={plant}
                onWaterPlant={handleWaterPlant}
                advice={pageData.wateringAdvice}
                isLoadingAdvice={isPageLoading}
                onFeedback={handleFeedback}
              />
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Chat with Sage</CardTitle>
                 <CardDescription>Ask a question about your <span className="italic">{displayName}</span>.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Button className="w-full" disabled={isApiKeyMissing} onClick={() => handleOpenChat()}>
                    <MessageSquare className="mr-2" /> Chat Now
                 </Button>
              </CardContent>
            </Card>
            <PlantJournal plant={plant} />
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl">Quick View</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="grid gap-3 text-sm">
                    <div className="font-semibold">Details</div>
                    <ul className="grid gap-2">
                      {plant.estimatedAge && <li className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Leaf className="h-4 w-4" /> Est. Age</span>
                        <span>{plant.estimatedAge}</span>
                      </li>}
                       <li className="flex items-center justify-between">
                         <span className="text-muted-foreground flex items-center gap-2"><Home className="h-4 w-4" /> Placement</span>
                         <div className="flex items-center gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            size="xs" 
                                            variant={plant.placement === 'Indoor' ? 'default' : 'outline'}
                                            onClick={() => handleSetPlacement('Indoor')}
                                            disabled={isSettingPlacement !== false || isApiKeyMissing}
                                            className="rounded-full"
                                            >
                                            {isSettingPlacement === 'Indoor' ? <Loader2 className="h-3 w-3 animate-spin"/> : <Home className="h-3 w-3" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Indoor</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            size="xs" 
                                            variant={plant.placement === 'Outdoor' ? 'default' : 'outline'}
                                            onClick={() => handleSetPlacement('Outdoor')}
                                            disabled={isSettingPlacement !== false || isApiKeyMissing}
                                            className="rounded-full"
                                            >
                                             {isSettingPlacement === 'Outdoor' ? <Loader2 className="h-3 w-3 animate-spin"/> : <Sun className="h-3 w-3" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Outdoor</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                         </div>
                      </li>
                       {settings.location && <li className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</span>
                        <span>{settings.location}</span>
                      </li>}
                      <QuickViewWateringStatus plant={plant} advice={pageData.wateringAdvice} />
                    </ul>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
         <div className="flex items-center justify-center gap-2 md:hidden">
            <Button variant="outline" size="sm" asChild>
                <Link href={`/plant/${plant.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{plant.customName}" from your garden. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
      </div>
      <Dialog open={isChatOpen} onOpenChange={(open) => {
        setIsChatOpen(open);
        // Clear context when closing the dialog
        if (!open) {
          setChatContext(undefined);
        }
      }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Chat about {plant.customName}</DialogTitle>
          </DialogHeader>
          {plant && <Chat plant={plant} initialContext={chatContext} onUpdate={onChatInteraction} />}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
