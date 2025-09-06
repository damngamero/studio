

"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSettingsStore, type Theme, type AIModel, type Settings } from "@/hooks/use-settings-store.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, MapPin, ChevronsUpDown, KeyRound } from "lucide-react";
import { timezones } from "@/lib/timezones";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const preferencesFormSchema = z.object({
  theme: z.custom<Theme>(),
  wateringReminders: z.boolean().default(true),
  metricUnits: z.boolean().default(false),
  timezone: z.string().default('UTC'),
  location: z.string().optional(),
  model: z.custom<AIModel>(),
  geminiApiKey: z.string().optional(),
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
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-3xl font-semibold mb-6">Settings</h1>
        <div className="grid gap-6">
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
                        <Select 
                          onValueChange={(value: Theme) => {
                            field.onChange(value);
                            // Also apply immediately
                            setSettings({ ...settings, theme: value });
                          }} 
                          defaultValue={field.value}
                        >
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
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Model</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an AI model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Fast &amp; Default)</SelectItem>
                            <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Powerful)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the AI model to power your assistant. Pro is more capable but may be slower.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <Separator />
                   <FormField
                    control={form.control}
                    name="geminiApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gemini API Key</FormLabel>
                        <FormControl>
                           <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="Enter your Google AI Studio API Key" {...field} className="pl-10" />
                           </div>
                        </FormControl>
                         <FormDescription>
                          Your API key is stored only on this device. Get a key from{' '}
                          <Link href="https://aistudio.google.com/app/apikey" target="_blank" className="underline">Google AI Studio</Link>.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />
                   <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Location</FormLabel>
                        <FormControl>
                           <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="e.g. San Francisco, CA" {...field} className="pl-10" />
                           </div>
                        </FormControl>
                         <FormDescription>
                          Used to provide weather-based care tips.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />
                  
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                       <FormItem className="flex flex-col">
                        <FormLabel>Timezone</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-[240px] justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? timezones.find(
                                      (tz) => tz === field.value
                                    )
                                  : "Select timezone"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[240px] p-0">
                            <Command>
                              <CommandInput placeholder="Search timezone..." />
                              <CommandList>
                                <CommandEmpty>No timezone found.</CommandEmpty>
                                <CommandGroup>
                                  {timezones.map((tz) => (
                                    <CommandItem
                                      value={tz}
                                      key={tz}
                                      onSelect={() => {
                                        form.setValue("timezone", tz)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          tz === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {tz}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                           This is used to provide accurate watering schedules.
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
      </div>
    </AppLayout>
  );
}
