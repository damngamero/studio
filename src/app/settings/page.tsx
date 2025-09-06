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

export default function SettingsPage() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      apiKey: "", // In a real app, this would be loaded from a secure store
    },
  });
  
  const onSubmit = (values: z.infer<typeof settingsFormSchema>) => {
    // In a real app, you would securely save the API key.
    // For this demo, we'll just show a toast.
    console.log("Saving API Key:", values.apiKey);
    toast({
      title: "Settings Saved",
      description: "Your new settings have been applied.",
    });
  };

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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
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
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your app experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel>Watering Reminders</FormLabel>
                  <FormDescription>Receive notifications when it's time to water your plants.</FormDescription>
                </div>
                <Switch id="watering-reminders" defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <FormLabel>Use Metric Units</FormLabel>
                  <FormDescription>Display measurements in cm/ml instead of inches/oz.</FormDescription>
                </div>
                <Switch id="metric-units" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
