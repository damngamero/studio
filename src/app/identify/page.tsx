
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, Loader2, Sparkles, Save, Upload, CircleUserRound, Lightbulb, AlertTriangle, KeyRound, Pencil, Leaf } from "lucide-react";
import Link from "next/link";

import { identifyPlantFromPhoto } from "@/ai/flows/identify-plant-from-photo";
import type { IdentifyPlantFromPhotoOutput } from "@/ai/flows/identify-plant-from-photo";
import { getPlantCareTips } from "@/ai/flows/get-plant-care-tips";
import { getPlantNicknames } from "@/ai/flows/get-plant-nicknames";
import { getPlantPlacement } from "@/ai/flows/get-plant-placement";
import { usePlantStore } from "@/hooks/use-plant-store";
import { useAchievementStore } from "@/hooks/use-achievement-store";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const profileFormSchema = z.object({
  customName: z.string().min(1, "Please give your plant a nickname."),
  commonName: z.string().min(1, "Please provide the plant's common name."),
  latinName: z.string().min(1, "Please provide the plant's latin name."),
  displayNameFormat: z.enum(["common", "latin"]),
  notes: z.string().optional(),
});

type InputMode = "upload" | "camera";

export default function IdentifyPlantPage() {
  const router = useRouter();
  const { addPlant, plants } = usePlantStore();
  const { checkAndUnlock } = useAchievementStore();
  const { settings } = useSettingsStore();
  const { toast } = useToast();
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [identification, setIdentification] = useState<IdentifyPlantFromPhotoOutput | null>(null);
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      customName: "",
      commonName: "",
      latinName: "",
      displayNameFormat: "common",
      notes: "",
    },
  });

  useEffect(() => {
    setIsApiKeyMissing(!settings.geminiApiKey);
  }, [settings.geminiApiKey]);

  useEffect(() => {
    if (inputMode === "camera") {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
    setSuggestedNames([]);
    try {
      const result = await identifyPlantFromPhoto({ photoDataUri, apiKey: settings.geminiApiKey });
      if (!result.isPlant) {
        setError("This doesn't look like a plant. Please try another photo.");
        setIdentification(null);
      } else {
        setIdentification(result);
        form.reset({
          customName: result.commonName,
          commonName: result.commonName,
          latinName: result.latinName,
          displayNameFormat: 'common',
          notes: "",
        });
        
        // Fetch suggested names in parallel
        setIsLoadingNames(true);
        getPlantNicknames({ commonName: result.commonName, latinName: result.latinName, apiKey: settings.geminiApiKey })
            .then(nameResult => setSuggestedNames(nameResult.nicknames))
            .catch(e => console.error("Could not fetch nicknames", e))
            .finally(() => setIsLoadingNames(false));
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


  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!identification || !photoDataUri) return;
    setIsSaving(true);
    
    try {
      // Get initial care tips and watering frequency using the final (potentially user-edited) common name
      const [careTipsResult, placementResult] = await Promise.all([
        getPlantCareTips({ 
          plantSpecies: values.commonName,
          estimatedAge: identification.estimatedAge,
          location: settings.location,
          apiKey: settings.geminiApiKey,
        }),
        getPlantPlacement({ plantSpecies: values.commonName, apiKey: settings.geminiApiKey })
      ]);


      const newPlant = addPlant({
        ...values,
        photoUrl: photoDataUri,
        estimatedAge: identification.estimatedAge,
        lastWatered: new Date().toISOString(),
        wateringFrequency: careTipsResult.wateringFrequency,
        wateringTime: careTipsResult.wateringTime,
        wateringAmount: careTipsResult.wateringAmount,
        careTips: careTipsResult.careTips,
        placement: placementResult.placement,
        recommendedPlacement: placementResult.placement,
      });
      
      toast({
        title: "Plant Added!",
        description: `${values.customName} has been added to your garden.`,
      });

      // Check for achievements
      const plantCount = plants.length + 1;
      checkAndUnlock(['first_plant', 'plant_collector', 'plant_enthusiast'], plantCount);


      router.push(`/plant/${newPlant.id}`);

    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Could not save plant',
        description: 'Failed to get initial care tips. Please try again.'
      });
    } finally {
        setIsSaving(false);
    }
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
        
        {isApiKeyMissing && (
            <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Gemini API Key Required</AlertTitle>
                <AlertDescription>
                Please set your Gemini API Key in the settings to use the AI-powered features.
                <Button asChild variant="link" className="p-0 h-auto ml-1 font-semibold">
                    <Link href="/settings">Go to Settings</Link>
                </Button>
                </AlertDescription>
            </Alert>
        )}
        
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
                  <Button onClick={handleIdentify} disabled={!photoDataUri || isLoading || isApiKeyMissing} size="lg">
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
              <CardDescription>Sage has identified your plant. You can edit the details below before saving.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="mb-4 p-3 bg-secondary rounded-lg border text-sm">
                <p>Est. Age: <span className="font-medium">{identification.estimatedAge}</span></p>
                <p>Confidence: <span className="font-medium">{Math.round(identification.confidence * 100)}%</span></p>
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
                          <Input placeholder="e.g., Freddie the Fiddle Leaf" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                   {isLoadingNames && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Asking Sage for name ideas...</span>
                    </div>
                  )}

                  {suggestedNames.length > 0 && (
                    <div className="space-y-2 animate-in fade-in">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Lightbulb className="h-4 w-4" />
                            <span>Name ideas from Sage:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                        {suggestedNames.map((name) => (
                            <Badge
                            key={name}
                            variant="outline"
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => form.setValue("customName", name)}
                            >
                            {name}
                            </Badge>
                        ))}
                        </div>
                    </div>
                  )}

                  <hr className="my-4"/>

                  <FormField
                    control={form.control}
                    name="commonName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Common Name</FormLabel>
                         <FormControl>
                           <div className="relative">
                            <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} className="pl-10" />
                           </div>
                        </FormControl>
                         <FormDescription>The official species name used to get care tips.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="latinName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latin Name</FormLabel>
                        <FormControl>
                           <div className="relative">
                             <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <Input {...field} className="pl-10" />
                           </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="displayNameFormat"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Display Name Format</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="common" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Common Name ({form.getValues('commonName')})
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="latin" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Latin Name ({form.getValues('latinName')})
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
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
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Repotted on Jan 1st. Likes morning sun." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
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
