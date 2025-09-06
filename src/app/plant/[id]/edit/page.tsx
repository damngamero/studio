
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";

import { usePlantStore } from "@/hooks/use-plant-store";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import type { Plant } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const editFormSchema = z.object({
  customName: z.string().min(1, "Please give your plant a name."),
  notes: z.string().optional(),
  environmentNotes: z.string().optional(),
  lastWatered: z.date(),
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
    defaultValues: {
      customName: "",
      notes: "",
      environmentNotes: "",
      lastWatered: new Date(),
    },
  });

  useEffect(() => {
    if (plantId) {
      const foundPlant = getPlantById(plantId);
      setPlant(foundPlant);
      if (foundPlant) {
        form.reset({
          customName: foundPlant.customName,
          notes: foundPlant.notes || "",
          environmentNotes: foundPlant.environmentNotes || "",
          lastWatered: new Date(foundPlant.lastWatered),
        });
      }
    }
  }, [plantId, getPlantById, form]);

  const onSubmit = (values: z.infer<typeof editFormSchema>) => {
    if (!plant) return;

    updatePlant({
      ...plant,
      ...values,
      lastWatered: values.lastWatered.toISOString(),
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
        
        <div className="relative aspect-video w-full max-w-sm mx-auto rounded-lg overflow-hidden shadow-lg mb-8">
            <Image src={plant.photoUrl} alt={plant.customName} width={400} height={300} className="object-cover" data-ai-hint="plant" />
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
                name="lastWatered"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Last Watered Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      This helps Sage calculate the next watering date.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Notes</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[120px]" placeholder="e.g., Repotted on Feb 5th. Showing new growth!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="environmentNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environment Notes</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[120px]" placeholder="e.g., In the living room, next to a north-facing window. Average temp is 70°F." {...field} />
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
