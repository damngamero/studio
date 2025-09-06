"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, Loader2, Sparkles, Save, Upload, SwitchCamera, CircleUserRound } from "lucide-react";

import { identifyPlantFromPhoto } from "@/ai/flows/identify-plant-from-photo";
import type { IdentifyPlantFromPhotoOutput } from "@/ai/flows/identify-plant-from-photo";
import { usePlantStore } from "@/hooks/use-plant-store";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const profileFormSchema = z.object({
  customName: z.string().min(1, "Please give your plant a name."),
  notes: z.string().optional(),
});

type InputMode = "upload" | "camera";

export default function IdentifyPlantPage() {
  const router = useRouter();
  const { addPlant } = usePlantStore();
  const { toast } = useToast();
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [identification, setIdentification] = useState<IdentifyPlantFromPhotoOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (inputMode === "camera") {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this app.',
          });
        }
      };

      getCameraPermission();

      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  }, [inputMode, toast]);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      customName: "",
      notes: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoDataUri(e.target?.result as string);
      setIdentification(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };
  
  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL("image/jpeg");
        setPhotoDataUri(dataUri);
        setIdentification(null);
        setError(null);
      }
    }
  };

  const handleIdentify = async () => {
    if (!photoDataUri) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await identifyPlantFromPhoto({ photoDataUri });
      if (!result.isPlant) {
        setError("This doesn't look like a plant. Please try another photo.");
        setIdentification(null);
      } else {
        setIdentification(result);
        form.setValue("customName", result.commonName);
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred during identification. Please try again.");
      toast({
        variant: "destructive",
        title: "Identification Failed",
        description: "Could not identify the plant. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (values: z.infer<typeof profileFormSchema>) => {
    if (!identification || !photoDataUri) return;

    addPlant({
      ...values,
      photoUrl: photoDataUri,
      commonName: identification.commonName,
      latinName: identification.latinName,
    });
    
    toast({
      title: "Plant Added!",
      description: `${values.customName} has been added to your garden.`,
    });

    router.push("/");
  };

  const PhotoDisplay = () => (
    <div className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/50 flex flex-col justify-center items-center relative overflow-hidden">
      {photoDataUri ? (
        <Image src={photoDataUri} alt="Plant to identify" fill className="object-contain rounded-lg p-2" data-ai-hint="plant" />
      ) : (
        <div className="text-center text-muted-foreground">
          <CircleUserRound className="w-12 h-12 mx-auto" />
          <span className="mt-2 text-sm">Your photo will appear here</span>
        </div>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold font-headline mb-8">Identify a New Plant</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Provide a Photo</CardTitle>
              <CardDescription>Upload a photo or use your camera.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as InputMode)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload"><Upload className="mr-2" /> Upload</TabsTrigger>
                  <TabsTrigger value="camera"><Camera className="mr-2"/> Camera</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-4 space-y-4">
                  <label htmlFor="plant-photo" className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/50 flex flex-col justify-center items-center cursor-pointer hover:bg-muted transition-colors relative">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <span className="mt-2 text-sm text-muted-foreground">Click or tap to upload a file</span>
                  </label>
                  <Input id="plant-photo" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </TabsContent>
                <TabsContent value="camera" className="mt-4 space-y-4">
                  <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                  </div>
                  {hasCameraPermission === false && (
                    <Alert variant="destructive">
                      <AlertTitle>Camera Access Required</AlertTitle>
                      <AlertDescription>
                        Please allow camera access to use this feature.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button onClick={handleCapture} disabled={!hasCameraPermission}>
                    <Camera className="mr-2" /> Capture Photo
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>2. Identify</CardTitle>
                <CardDescription>Your captured or uploaded photo will be shown here.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <PhotoDisplay />
              <Button onClick={handleIdentify} disabled={!photoDataUri || isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Identify Plant
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>
        </div>

        {identification && (
          <Card className="mt-8 animate-in fade-in duration-500">
            <CardHeader>
              <CardTitle>3. Create Profile</CardTitle>
              <CardDescription>We've identified your plant! Now give it a personal touch.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-secondary rounded-lg">
                <p className="font-semibold">Identified as: <span className="font-normal">{identification.commonName}</span></p>
                <p className="text-sm text-muted-foreground">{identification.latinName}</p>
                <p className="text-xs text-muted-foreground mt-1">Confidence: {Math.round(identification.confidence * 100)}%</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plant's Nickname</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Freddie the Fiddle Leaf" {...field} />
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
                        <FormLabel>Notes (Personalized Feedback)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Repotted on Jan 1st. Likes morning sun." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save to My Plants
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
