"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const settingsFormSchema = z.object({
  apiKey: z.string().optional(),
});

// A new schema for the preferences form
const preferencesFormSchema = z.object({
  wateringReminders: z.boolean().default(true),
  metricUnits: z.boolean().default(false),
});

export default function SettingsPage() {
  const { toast } = useToast();

  const apiKeyForm = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      apiKey: "", // In a real app, this would be loaded from a secure store
    },
  });
  
  const preferencesForm = useForm<z.infer<typeof preferencesFormSchema>>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      wateringReminders: true,
      metricUnits: false,
    },
  });

  const onApiKeySubmit = (values: z.infer<typeof settingsFormSchema>) => {
    // In a real app, you would securely save the API key.
    // For this demo, we'll just show a toast.
    console.log("Saving API Key:", values.apiKey);
    toast({
      title: "Settings Saved",
      description: "Your new API key setting has been applied.",
    });
  };

  const onPreferencesSubmit = (values: z.infer<typeof preferencesFormSchema>) => {
    console.log("Saving preferences:", values);
    toast({
      title: "Preferences Saved",
      description: "Your new preferences have been applied.",
    });
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold font-headline mb-8">Settings</h1>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>Manage your external API keys here. This is for demonstration purposes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...apiKeyForm}>
                <form onSubmit={apiKeyForm.handleSubmit(onApiKeySubmit)} className="space-y-4">
                  <FormField
                    control={apiKeyForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plant Recognition API Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your key for the plant identification service.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Save API Key</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <Form {...preferencesForm}>
              <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)}>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your app experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                      control={preferencesForm.control}
                      name="wateringReminders"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                           <div>
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

                  <Separator />

                  <FormField
                      control={preferencesForm.control}
                      name="metricUnits"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                           <div>
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
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
