"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSettingsStore, type Theme } from "@/hooks/use-settings-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check } from "lucide-react";

const preferencesFormSchema = z.object({
  theme: z.custom<Theme>(),
  wateringReminders: z.boolean().default(true),
  metricUnits: z.boolean().default(false),
});

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, setSettings } = useSettingsStore();

  const form = useForm<z.infer<typeof preferencesFormSchema>>({
    resolver: zodResolver(preferencesFormSchema),
    values: settings,
  });

  const onSubmit = (values: z.infer<typeof preferencesFormSchema>) => {
    setSettings(values);
    toast({
      title: "Preferences Saved",
      description: "Your new preferences have been applied.",
      action: <div className="p-1.5 rounded-full bg-green-500"><Check className="h-4 w-4 text-white" /></div>
    });
  };
  
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold font-headline">Settings</h1>
          <p className="text-muted-foreground mt-1">Customize your app experience.</p>
        </header>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Changes are saved automatically to this device.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="theme-forest">Forest</SelectItem>
                          <SelectItem value="theme-sunny-meadow">Sunny Meadow</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a theme for the application.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="wateringReminders"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                        <FormLabel>Watering Reminders</FormLabel>
                        <FormDescription>Receive notifications when it's time to water your plants.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                    control={form.control}
                    name="metricUnits"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                          <FormLabel>Use Metric Units</FormLabel>
                          <FormDescription>Display measurements in cm/ml instead of inches/oz.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
              </CardContent>
            </Card>

            <Button type="submit" className="mt-6">
              Save Preferences
            </Button>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
