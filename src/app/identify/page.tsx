"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import { cn } from "@/lib/utils";

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
  const [isDragging, setIsDragging] = useState(false);

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

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload an image file.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoDataUri(e.target?.result as string);
      setIdentification(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
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

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); // Necessary to allow drop
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if(file) {
            handleFile(file);
            // Switch to upload tab if not already there
            setInputMode("upload");
            toast({
                title: "Image Pasted!",
                description: "We've loaded your image. Ready to identify!",
            });
        }
        break; 
      }
    }
  }, [toast]);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);


  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      customName: "",
      notes: "",
    },
  });


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
    <div className="w-full aspect-video bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col justify-center items-center relative overflow-hidden">
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
        <h1 className="text-3xl font-bold font-headline mb-2">Identify a New Plant</h1>
        <p className="text-muted-foreground mb-8">Upload a photo to get started.</p>
        
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as InputMode)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload"><Upload className="mr-2" /> Upload</TabsTrigger>
                    <TabsTrigger value="camera"><Camera className="mr-2"/> Camera</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-4 space-y-4">
                    <label 
                      htmlFor="plant-photo" 
                      className={cn(
                        "w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col justify-center items-center cursor-pointer bg-muted/50 hover:bg-muted transition-colors relative",
                        isDragging && "bg-accent border-primary"
                      )}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <span className="mt-2 text-sm text-muted-foreground text-center px-4">
                        {isDragging ? "Drop the image here!" : "Click, paste, or drag & drop a file"}
                      </span>
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
              </div>
              
              <div className="flex flex-col items-center gap-4">
                  <PhotoDisplay />
                  <Button onClick={handleIdentify} disabled={!photoDataUri || isLoading} size="lg">
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Identify Plant
                  </Button>
                  {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {identification && (
          <Card className="mt-8 animate-in fade-in duration-500">
            <CardHeader>
              <CardTitle>Plant Identified!</CardTitle>
              <CardDescription>We've identified your plant as a {identification.commonName}. Now give it a personal touch.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-secondary rounded-lg border">
                <p className="font-semibold text-lg">{identification.commonName}</p>
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
                        <FormLabel>Notes</FormLabel>
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
