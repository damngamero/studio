
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Trash2, Bot, Loader2, MessageSquare, Leaf, Droplets, Sun, Stethoscope, Camera, X, MapPin, AlertTriangle, Info, CloudSun } from "lucide-react";

import { usePlantStore } from "@/hooks/use-plant-store";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { getPlantCareTips } from "@/ai/flows/get-plant-care-tips";
import { checkPlantHealth } from "@/ai/flows/check-plant-health";
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

export default function PlantProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { getPlantById, deletePlant, updatePlant } = usePlantStore();
  const { settings } = useSettingsStore();
  const { toast } = useToast();
  
  const [plant, setPlant] = useState<Plant | null | undefined>(undefined);
  const [isFetchingTips, setIsFetchingTips] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isHealthCheckModalOpen, setIsHealthCheckModalOpen] = useState(false);
  const [healthCheckPhoto, setHealthCheckPhoto] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);


  const plantId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (plantId) {
      const foundPlant = getPlantById(plantId);
      setPlant(foundPlant);
    }
  }, [plantId, getPlantById]);
  
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
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

  const handleGenerateTips = async () => {
    if (!plant) return;
    setIsFetchingTips(true);
    try {
      const tipsResult = await getPlantCareTips({ 
        plantSpecies: plant.commonName,
        environmentNotes: plant.environmentNotes,
        lastWatered: plant.lastWatered,
        estimatedAge: plant.estimatedAge,
        location: settings.location,
      });
      const updatedPlant = { 
        ...plant, 
        careTips: tipsResult.careTips,
        wateringFrequency: tipsResult.wateringFrequency,
        wateringTime: tipsResult.wateringTime,
      };
      updatePlant(updatedPlant);
      setPlant(updatedPlant);
      toast({
        title: "Care Tips Generated!",
        description: "Sage has added new care tips for your plant.",
      });
    } catch (error) {
      console.error("Failed to get care tips:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate care tips. Please try again.",
      });
    } finally {
      setIsFetchingTips(false);
    }
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
        notes: plant.notes 
      });
      const updatedPlant = { ...plant, health: healthResult, photoUrl: healthCheckPhoto };
      updatePlant(updatedPlant);
      setPlant(updatedPlant);
      toast({
        title: "Health Check Complete!",
        description: "Sage has assessed your plant's health.",
      });
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

  const handleWaterPlant = () => {
    if (!plant) return;
    const updatedPlant = { ...plant, lastWatered: new Date().toISOString() };
    updatePlant(updatedPlant);
    setPlant(updatedPlant);
    toast({
      title: "Plant Watered!",
      description: `Nice work! ${plant.customName} has been watered.`,
    });
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
            {plant.commonName}
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
                 <Dialog>
                    <DialogTrigger asChild>
                      <div className="relative aspect-video w-full rounded-md overflow-hidden shadow-md mb-6 cursor-pointer">
                        <Image 
                          src={plant.photoUrl} 
                          alt={plant.customName} 
                          fill
                          className="object-contain w-full h-full" 
                          data-ai-hint="plant" 
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-0">
                        <InteractivePhoto photoDataUri={plant.photoUrl} plantName={plant.customName} />
                    </DialogContent>
                  </Dialog>
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
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No health check performed yet.</p>
                  )}
                   <Dialog open={isHealthCheckModalOpen} onOpenChange={setIsHealthCheckModalOpen}>
                      <DialogTrigger asChild>
                         <Button variant="outline" size="sm" className="mt-3">
                            <Stethoscope className="mr-2 h-4 w-4" /> {plant.health ? 'Re-check Health' : 'Check Health'}
                         </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Daily Health Check</DialogTitle>
                           <DialogDescription>Take a new photo of your plant for today's health assessment.</DialogDescription>
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
                              Run Health Check
                            </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                </div>
                <Separator />
                 <div>
                    <h4 className="font-medium text-sm mb-2">Sage's Care Tips</h4>
                    {plant.careTips ? (
                      <Accordion type="single" collapsible defaultValue="item-1">
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="text-sm">View Care Tips</AccordionTrigger>
                          <AccordionContent className="whitespace-pre-wrap text-sm">{plant.careTips}</AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      <p className="text-sm text-muted-foreground">No care tips generated yet.</p>
                    )}
                    <Button onClick={handleGenerateTips} disabled={isFetchingTips} className="mt-3" size="sm" variant="outline">
                      {isFetchingTips ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Bot className="mr-2 h-4 w-4" />
                      )}
                      {plant.careTips ? 'Regenerate' : 'Generate'}
                    </Button>
                 </div>
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Proactive Tips</CardTitle>
                    <CardDescription>Sage provides timely advice based on local weather.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg flex flex-col items-center justify-center text-center gap-3">
                        <CloudSun className="h-8 w-8"/>
                        <span>Proactive weather tips for all your plants are available on the new Weather page.</span>
                        <Button asChild size="sm" className="mt-2">
                           <Link href="/weather">Go to Weather Center</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
          </div>
          <div className="grid auto-rows-max items-start gap-6">
             <WateringSchedule 
                lastWatered={plant.lastWatered}
                wateringFrequency={plant.wateringFrequency}
                wateringTime={plant.wateringTime}
                onWaterPlant={handleWaterPlant}
              />
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Chat with Sage</CardTitle>
                 <CardDescription>Ask a question about your <span className="italic">{plant.commonName}</span>.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <MessageSquare className="mr-2" /> Chat Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[625px]">
                      <DialogHeader>
                        <DialogTitle>Chat about {plant.customName}</DialogTitle>
                      </DialogHeader>
                      <Chat plantName={plant.commonName} />
                    </DialogContent>
                  </Dialog>
              </CardContent>
            </Card>
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
                       {settings.location && <li className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</span>
                        <span>{settings.location}</span>
                      </li>}
                      <li className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Droplets className="h-4 w-4" /> Watering</span>
                        <span>~ Every {plant.wateringFrequency || '?'} days</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Sun className="h-4 w-4" /> Sunlight</span>
                        <span>Indirect Light</span>
                      </li>
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
    </AppLayout>
  );
}
