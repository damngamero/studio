
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlantStore } from '@/hooks/use-plant-store';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { getWeatherAndPlantAdvice } from '@/ai/flows/get-weather-and-plant-advice';
import type { GetWeatherAndPlantAdviceOutput } from '@/ai/flows/get-weather-and-plant-advice';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Thermometer, Wind } from 'lucide-react';

const weatherIcons: { [key: string]: React.ElementType } = {
  'sunny': Sun,
  'partly cloudy': CloudSun,
  'cloudy': Cloud,
  'rain': CloudRain,
  'thunderstorms': CloudLightning,
  'windy': Wind,
  'fog': CloudFog,
  'snow': CloudSnow,
  'drizzle': CloudDrizzle,
};

function WeatherIcon({ condition, className }: { condition: string; className?: string }) {
  const Icon = weatherIcons[condition.toLowerCase()] || Cloud;
  return <Icon className={className} />;
}

export default function WeatherPage() {
  const { plants } = usePlantStore();
  const { settings } = useSettingsStore();
  const [weatherData, setWeatherData] = useState<GetWeatherAndPlantAdviceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!settings.location || plants.length === 0) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const plantInfo = plants.map(p => ({ customName: p.customName, commonName: p.commonName }));
        const result = await getWeatherAndPlantAdvice({ location: settings.location, plants: plantInfo });
        setWeatherData(result);
      } catch (e) {
        console.error("Failed to get weather advice:", e);
        setError("Could not fetch weather advice from Sage. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [settings.location, plants]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
      );
    }
    
    if (error) {
       return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
    }

    if (!settings.location) {
      return (
        <Alert>
          <AlertTitle>Location Not Set</AlertTitle>
          <AlertDescription>
            Please set your location in the settings to get weather-based advice.
            <Button asChild variant="link" className="p-0 h-auto ml-1">
                <Link href="/settings">Go to Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (plants.length === 0) {
      return (
         <Alert>
          <AlertTitle>No Plants Found</AlertTitle>
          <AlertDescription>
            You need to add some plants to your garden to get weather advice.
             <Button asChild variant="link" className="p-0 h-auto ml-1">
                <Link href="/identify">Add a Plant</Link>
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!weatherData) {
        return <p>No weather data available.</p>
    }
    
    const { currentWeather, forecast, plantAdvice } = weatherData;

    return (
        <div className="grid gap-8">
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Current Weather in {settings.location}</CardTitle>
                        <CardDescription>Here's what it looks like outside right now.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <WeatherIcon condition={currentWeather.condition} className="w-20 h-20 text-primary" />
                            <div>
                                <p className="text-5xl font-bold">{currentWeather.temperature}°C</p>
                                <p className="text-muted-foreground">{currentWeather.condition}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-muted-foreground" /> Humidity: {currentWeather.humidity}%</div>
                            <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-muted-foreground" /> Wind: {currentWeather.windSpeed} km/h</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div>
                <h2 className="text-2xl font-bold font-heading mb-4">3-Day Forecast</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    {forecast.map(day => (
                        <Card key={day.day}>
                            <CardContent className="p-4 flex items-center justify-between">
                                 <div>
                                    <p className="font-semibold">{day.day}</p>
                                    <p className="text-sm text-muted-foreground">{day.condition}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <p className="text-2xl font-bold">{day.temperature}°C</p>
                                    <WeatherIcon condition={day.condition} className="w-8 h-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
             <div>
                <h2 className="text-2xl font-bold font-heading mb-4">Sage's Proactive Advice</h2>
                 <div className="space-y-4">
                     {plantAdvice.map(advice => (
                        <Card key={advice.customName}>
                           <CardHeader>
                               <CardTitle className="text-lg">{advice.customName}</CardTitle>
                           </CardHeader>
                           <CardContent>
                               <p className="text-sm">{advice.advice}</p>
                           </CardContent>
                        </Card>
                     ))}
                </div>
            </div>
        </div>
    )
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Weather Center</h1>
          <p className="text-muted-foreground">Proactive advice from Sage based on your local forecast.</p>
        </div>
      </div>
      {renderContent()}
    </AppLayout>
  );
}
