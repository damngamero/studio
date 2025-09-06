"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Save } from "lucide-react";

import { usePlantStore } from "@/hooks/use-plant-store";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import type { Plant } from "@/lib/types";

const editFormSchema = z.object({
  customName: z.string().min(1, "Please give your plant a name."),
  notes: z.string().optional(),
});

export default function EditPlantPage() {
  const router = useRouter();
  const params = useParams();
  const { getPlantById, updatePlant } = usePlantStore();
  const { toast } = useToast();
  
  const plantId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [plant, setPlant] = useState<Plant | null | undefined>(undefined);

  const form = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
  });

  useEffect(() => {
    if (plantId) {
      const foundPlant = getPlantById(plantId);
      setPlant(foundPlant);
      if (foundPlant) {
        form.reset({
          customName: foundPlant.customName,
          notes: foundPlant.notes || "",
        });
      }
    }
  }, [plantId, getPlantById, form]);

  const onSubmit = (values: z.infer<typeof editFormSchema>) => {
    if (!plant) return;

    updatePlant({
      ...plant,
      ...values,
    });
    
    toast({
      title: "Plant Updated!",
      description: `${values.customName} has been updated.`,
    });

    router.push(`/plant/${plant.id}`);
  };

  if (plant === undefined) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto"><Skeleton className="w-full h-96" /></div>
      </AppLayout>
    );
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold font-headline mb-8">Edit {plant.customName}</h1>
        
        <div className="relative aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden shadow-lg mb-8">
            <Image src={plant.photoUrl} alt={plant.customName} fill className="object-cover" data-ai-hint="plant" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <p className="text-white text-center text-sm p-4">Photo editing is not currently supported.</p>
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="customName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plant's Nickname</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[120px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="ghost" asChild>
                <Link href={`/plant/${plant.id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
