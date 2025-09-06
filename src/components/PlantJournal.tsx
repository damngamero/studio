
"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { BookOpen, Plus, Image as ImageIcon, Send, Loader2 } from "lucide-react";

import type { Plant, JournalEntry } from "@/lib/types";
import { usePlantStore } from "@/hooks/use-plant-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const journalFormSchema = z.object({
  notes: z.string().min(1, "Please add some notes for your journal entry."),
});

interface PlantJournalProps {
  plant: Plant;
}

export function PlantJournal({ plant }: PlantJournalProps) {
  const { updatePlant } = usePlantStore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [entryPhotoDataUri, setEntryPhotoDataUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof journalFormSchema>>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      notes: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEntryPhotoDataUri(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: z.infer<typeof journalFormSchema>) => {
    setIsLoading(true);
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      notes: values.notes,
      ...(entryPhotoDataUri && { photoUrl: entryPhotoDataUri }),
    };

    const updatedPlant: Plant = {
      ...plant,
      journal: [newEntry, ...(plant.journal || [])],
    };

    updatePlant(updatedPlant);
    toast({
      title: "Journal Entry Added!",
      description: "Your new entry has been saved.",
    });
    setIsLoading(false);
    setIsDialogOpen(false);
    form.reset();
    setEntryPhotoDataUri(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Plant Journal</CardTitle>
          <CardDescription>Track your plant's progress.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="outline">
              <Plus />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
              <DialogDescription>
                Add a new photo and notes to document your plant's current state.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <FormLabel>Entry Photo (Optional)</FormLabel>
                    <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden relative">
                        {entryPhotoDataUri ? (
                            <Image src={entryPhotoDataUri} alt="Journal entry photo" fill className="object-contain" />
                        ) : (
                            <ImageIcon className="w-12 h-12 text-muted-foreground" />
                        )}
                    </div>
                    <Input id="journal-photo" type="file" accept="image/*" onChange={handleFileChange} />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Noticed new leaf growth today! The colors look vibrant." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Entry
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {(!plant.journal || plant.journal.length === 0) ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            <BookOpen className="mx-auto h-8 w-8 mb-2" />
            No journal entries yet.
          </div>
        ) : (
          <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
            {plant.journal.map((entry) => (
              <div key={entry.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary mt-1"></div>
                  <div className="flex-1 w-px bg-border"></div>
                </div>
                <div className="pb-6 w-full">
                  <p className="font-semibold text-sm">{format(new Date(entry.date), "PPP")}</p>
                  {entry.photoUrl && (
                     <div className="relative aspect-video w-full rounded-md overflow-hidden shadow-sm my-2">
                        <Image src={entry.photoUrl} alt={`Journal entry for ${plant.customName}`} fill className="object-cover" />
                     </div>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.notes}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
