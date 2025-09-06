"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Trash2, Bot, Loader2 } from "lucide-react";

import { usePlantStore } from "@/hooks/use-plant-store";
import { getPlantCareTips } from "@/ai/flows/get-plant-care-tips";
import type { Plant } from "@/lib/types";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlantProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { getPlantById, deletePlant, updatePlant } = usePlantStore();
  const { toast } = useToast();
  
  const [plant, setPlant] = useState<Plant | null | undefined>(undefined);
  const [isFetchingTips, setIsFetchingTips] = useState(false);

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
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg mb-4">
              <Image src={plant.photoUrl} alt={plant.customName} fill className="object-cover" data-ai-hint="plant" />
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/plant/${plant.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
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

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold font-headline">{plant.customName}</h1>
              <p className="text-xl text-muted-foreground">{plant.commonName}</p>
              <p className="text-sm text-muted-foreground italic">{plant.latinName}</p>
            </div>

            {plant.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{plant.notes}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-secondary/50">
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
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
