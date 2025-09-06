
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Trash2, Bot, Loader2, MessageSquare, Leaf, Droplets, Sun, Stethoscope } from "lucide-react";

import { usePlantStore } from "@/hooks/use-plant-store";
import { getPlantCareTips } from "@/ai/flows/get-plant-care-tips";
import { checkPlantHealth } from "@/ai/flows/check-plant-health";
import type { Plant, PlantHealthState } from "@/lib/types";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Chat } from "@/components/Chat";
import { Badge } from "@/components/ui/badge";

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
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
  const { toast } = useToast();
  
  const [plant, setPlant] = useState<Plant | null | undefined>(undefined);
  const [isFetchingTips, setIsFetchingTips] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const plantId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (plantId) {
      const foundPlant = getPlantById(plantId);
      setPlant(foundPlant);
    }
  }, [plantId, getPlantById]);

  const handleGenerateTips = async () => {
    if (!plant) return;
    setIsFetchingTips(true);
    try {
      const tipsResult = await getPlantCareTips({ plantSpecies: plant.commonName });
      const updatedPlant = { ...plant, careTips: tipsResult.careTips };
      updatePlant(updatedPlant);
      setPlant(updatedPlant);
      toast({
        title: "Care Tips Generated!",
        description: "We've added new care tips for your plant.",
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
    if (!plant) return;
    setIsCheckingHealth(true);
    try {
      const healthResult = await checkPlantHealth({ 
        photoDataUri: plant.photoUrl,
        notes: plant.notes 
      });
      const updatedPlant = { ...plant, health: healthResult };
      updatePlant(updatedPlant);
      setPlant(updatedPlant);
      toast({
        title: "Health Check Complete!",
        description: "We've assessed your plant's health.",
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

  return (
    <AppLayout>
      <div className="mx-auto grid max-w-6xl flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            {plant.customName}
          </h1>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
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
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>{plant.customName}</CardTitle>
                <CardDescription>{plant.commonName} | <span className="italic">{plant.latinName}</span></CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg mb-4">
                  <Image 
                    src={plant.photoUrl} 
                    alt={plant.customName} 
                    fill
                    className="object-cover w-full h-full" 
                    data-ai-hint="plant" 
                  />
                </div>
                 {plant.notes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Notes</h3>
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground">{plant.notes}</p>
                    </div>
                  )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Care Tips</CardTitle>
                <CardDescription>Get personalized advice for your plant.</CardDescription>
              </CardHeader>
              <CardContent>
                {plant.careTips ? (
                  <Accordion type="single" collapsible defaultValue="item-1">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>View Care Tips</AccordionTrigger>
                      <AccordionContent className="whitespace-pre-wrap text-sm">{plant.careTips}</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">No care tips generated yet.</p>
                )}
                 <Button onClick={handleGenerateTips} disabled={isFetchingTips} className="mt-4">
                  {isFetchingTips ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="mr-2 h-4 w-4" />
                  )}
                  {plant.careTips ? 'Regenerate Tips' : 'Generate Tips'}
                </Button>
              </CardContent>
            </Card>
             <Card>
               <CardHeader>
                <CardTitle>AI Health Check</CardTitle>
                <CardDescription>Assess your plant's health from its photo.</CardDescription>
              </CardHeader>
              <CardContent>
                {plant.health ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Status:</span> 
                      <Badge variant={plant.health.isHealthy ? 'default' : 'destructive'}>
                        {plant.health.isHealthy ? 'Healthy' : 'Needs Attention'}
                      </Badge>
                    </div>
                    <p className="text-sm whitespace-pre-wrap"><span className="font-semibold">Diagnosis:</span> {plant.health.diagnosis}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">No health check performed yet.</p>
                )}
                 <Button onClick={handleCheckHealth} disabled={isCheckingHealth} className="mt-4">
                  {isCheckingHealth ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Stethoscope className="mr-2 h-4 w-4" />
                  )}
                  {plant.health ? 'Re-check Health' : 'Check Health'}
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Chat with AI</CardTitle>
                 <CardDescription>Ask any question about your plant.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
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
                <CardTitle>Quick View</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="grid gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Droplets className="h-4 w-4 text-muted-foreground" />
                      <span>Needs watering twice a week</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Sun className="h-4 w-4 text-muted-foreground" />
                      <span>Loves bright, indirect light</span>
                    </div>
                     <div className="flex items-center gap-2 text-sm">
                      <Leaf className="h-4 w-4 text-muted-foreground" />
                      <span>Fertilize monthly</span>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
