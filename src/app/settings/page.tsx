

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
import { useSettingsStore, type Theme, type Settings } from "@/hooks/use-settings-store.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, MapPin, ChevronsUpDown, KeyRound, Info } from "lucide-react";
import { timezones } from "@/lib/timezones";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const preferencesFormSchema = z.object({
  theme: z.custom<Theme>(),
  wateringReminders: z.boolean().default(true),
  timezone: z.string().default('UTC'),
  location: z.string().optional(),
  geminiApiKey: z.string().optional(),
});

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, setSettings } = useSettingsStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof preferencesFormSchema>>({
    resolver: zodResolver(preferencesFormSchema),
    values: settings,
  });

  useEffect(() => {
    form.reset(settings);
  }, [settings, form]);

  const onSubmit = (values: z.infer<typeof preferencesFormSchema>) => {
    setSettings(values as Settings);
    toast({
      title: "Preferences Saved",
      description: "Your new preferences have been applied.",
      action: <div className="p-1.5 rounded-full bg-green-500"><Check className="h-4 w-4 text-white" /></div>
    });

    if (values.wateringReminders) {
        if ('Notification' in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }
  };
  
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl grid gap-6 md:grid-cols-[1fr_280px]">
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
                          onValueChange={field.onChange} 
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
                            <Input placeholder="e.g. San Francisco, CA" {...field} />
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
                  
                  {isClient && <FormField
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
                  />}

                  <Separator />
                  
                  <div className="space-y-4">
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
                    {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' && (
                        <Alert variant="destructive" className="mt-2 text-xs">
                            <AlertTitle>Notifications Blocked</AlertTitle>
                            <AlertDescription>
                                You have blocked notifications for this site. To receive reminders, please enable them in your browser settings.
                            </AlertDescription>
                        </Alert>
                    )}
                  </div>

                </CardContent>
              </Card>

              <Button type="submit" className="mt-6">
                Save Preferences
              </Button>
            </form>
          </Form>
        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>About VerdantWise</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        VerdantWise is an AI-powered smart gardening assistant designed to help you identify, care for, and nurture your plants.
                    </p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/about">
                            <Info className="mr-2 h-4 w-4" />
                            Learn More
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
