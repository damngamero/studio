
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlantStore } from '@/hooks/use-plant-store';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { getWeatherAndPlantAdvice } from '@/ai/flows/get-weather-and-plant-advice';
import type { GetWeatherAndPlantAdviceOutput, Weather, ForecastDay } from '@/ai/flows/get-weather-and-plant-advice';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Thermometer, Wind } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
          <div className="grid gap-8">
              <div>
                  <Card>
                      <CardHeader>
                          <CardTitle><Skeleton className="h-8 w-64" /></CardTitle>
                          <CardDescription><Skeleton className="h-4 w-48" /></CardDescription>
                      </CardHeader>
                      <CardContent>
                            <Skeleton className="h-20 w-full" />
                      </CardContent>
                  </Card>
              </div>
              <div>
                  <h2 className="text-2xl font-bold font-heading mb-4"><Skeleton className="h-8 w-48" /></h2>
                  <div className="grid md:grid-cols-3 gap-4">
                      {Array.from({length: 3}).map((_, i) => (
                          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                        ))}
                  </div>
              </div>
                <div>
                  <h2 className="text-2xl font-bold font-heading mb-4"><Skeleton className="h-8 w-56" /></h2>
                    <div className="space-y-4">
                        {Array.from({length: 2}).map((_, i) => (
                            <Card key={i}>
                              <CardHeader>
                                  <CardTitle className="text-lg"><Skeleton className="h-6 w-32" /></CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-2/3 mt-2" />
                              </CardContent>
                          </Card>
                        ))}
                  </div>
              </div>
          </div>
        )
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
    
    if (error) {
       return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
    }
    
    if (!weatherData) {
        return <p className="text-muted-foreground">No weather data available.</p>
    }

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
                            <WeatherIcon condition={weatherData.currentWeather.condition} className="w-20 h-20 text-primary" />
                            <div>
                                <p className="text-5xl font-bold">{weatherData.currentWeather.temperature}°{weatherData.currentWeather.temperatureUnit === 'celsius' ? 'C' : 'F'}</p>
                                <p className="text-muted-foreground">{weatherData.currentWeather.condition}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-muted-foreground" /> Humidity: {weatherData.currentWeather.humidity}%</div>
                            <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-muted-foreground" /> Wind: {weatherData.currentWeather.windSpeed} {weatherData.currentWeather.windSpeedUnit}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div>
                <h2 className="text-2xl font-bold font-heading mb-4">3-Day Forecast</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    {weatherData.forecast.map(day => (
                        <Card key={day.day}>
                            <CardContent className="p-4 flex items-center justify-between">
                                 <div>
                                    <p className="font-semibold">{day.day}</p>
                                    <p className="text-sm text-muted-foreground">{day.condition}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <p className="text-2xl font-bold">{day.temperature}°{weatherData.currentWeather.temperatureUnit === 'celsius' ? 'C' : 'F'}</p>
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
                     {weatherData.plantAdvice.map(advice => (
                        <Card key={advice.customName}>
                           <CardHeader>
                               <CardTitle className="text-lg">{advice.customName}</CardTitle>
                           </CardHeader>
                           <CardContent>
                               <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-strong:text-foreground">
                                <ReactMarkdown>{advice.advice}</ReactMarkdown>
                               </div>
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
