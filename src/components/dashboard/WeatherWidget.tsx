'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/overlay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/advanced';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/overlay';
import { getWeatherService, CurrentWeather, HourlyForecast, WeatherAlert } from '@/lib/api/weather';
import { formatTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils';

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
  venueName?: string;
  eventDate: Date;
  isOutdoor?: boolean;
}

const WEATHER_ICONS = {
  clear: Sun,
  partly_cloudy: Cloud,
  cloudy: Cloud,
  light_rain: CloudRain,
  heavy_rain: CloudRain,
  storm: CloudRain,
  snow: CloudSnow,
};

const WEATHER_COLORS = {
  clear: 'text-yellow-500',
  partly_cloudy: 'text-gray-400',
  cloudy: 'text-gray-500',
  light_rain: 'text-blue-400',
  heavy_rain: 'text-blue-600',
  storm: 'text-purple-600',
  snow: 'text-blue-200',
};

export default function WeatherWidget({
  latitude,
  longitude,
  venueName,
  eventDate,
  isOutdoor = true,
}: WeatherWidgetProps) {
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const weatherService = getWeatherService();

  const fetchWeatherData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = { latitude, longitude, name: venueName };
      
      const [currentData, hourlyData, alertsData] = await Promise.all([
        weatherService.getCurrentWeather(location),
        weatherService.getHourlyForecast(location),
        weatherService.getWeatherAlerts(location),
      ]);

      setCurrent(currentData);
      setHourly(hourlyData);
      setAlerts(alertsData);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to fetch weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [latitude, longitude]);

  if (isLoading && !current) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error && !current) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Weather Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const suitability = current ? weatherService.assessOutdoorSuitability(current) : null;
  const WeatherIcon = current ? WEATHER_ICONS[current.condition] : Sun;
  const weatherColor = current ? WEATHER_COLORS[current.condition] : 'text-gray-400';

  // Get hourly forecast for event day
  const eventDayHours = hourly.filter(h => {
    const forecastDate = new Date(h.time);
    return forecastDate.toDateString() === eventDate.toDateString();
  });

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Weather Forecast</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchWeatherData}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Weather */}
        {current && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <WeatherIcon className={cn('h-12 w-12', weatherColor)} />
                <div>
                  <div className="text-3xl font-bold">{current.temperature}°C</div>
                  <div className="text-sm text-muted-foreground">
                    Feels like {current.feelsLike}°C
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Wind className="h-4 w-4" />
                  <span>{current.windSpeed} km/h</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Droplets className="h-4 w-4" />
                  <span>{current.humidity}%</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground capitalize">
              {current.description}
            </p>
          </div>
        )}

        {/* Weather Alerts */}
        {alerts.length > 0 && (
          <Alert variant={alerts[0].severity === 'extreme' ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{alerts[0].title}</AlertTitle>
            <AlertDescription>{alerts[0].description}</AlertDescription>
          </Alert>
        )}

        {/* Outdoor Suitability (only for outdoor events) */}
        {isOutdoor && suitability && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={suitability.suitable ? 'default' : 'destructive'}>
                {suitability.suitable ? 'Suitable for outdoor event' : 'Challenging conditions'}
              </Badge>
            </div>
            
            {suitability.concerns.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Concerns:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {suitability.concerns.map((concern, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {suitability.recommendations.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Recommendations:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {suitability.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Hourly Forecast Tabs */}
        {eventDayHours.length > 0 && (
          <Tabs defaultValue="morning" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="morning">Morning</TabsTrigger>
              <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
              <TabsTrigger value="evening">Evening</TabsTrigger>
            </TabsList>
            
            <TabsContent value="morning" className="space-y-2 mt-4">
              {eventDayHours.slice(6, 12).map((hour) => (
                <HourlyForecastItem key={hour.time} forecast={hour} />
              ))}
            </TabsContent>
            
            <TabsContent value="afternoon" className="space-y-2 mt-4">
              {eventDayHours.slice(12, 18).map((hour) => (
                <HourlyForecastItem key={hour.time} forecast={hour} />
              ))}
            </TabsContent>
            
            <TabsContent value="evening" className="space-y-2 mt-4">
              {eventDayHours.slice(18, 24).map((hour) => (
                <HourlyForecastItem key={hour.time} forecast={hour} />
              ))}
            </TabsContent>
          </Tabs>
        )}

        {/* Last Update */}
        <p className="text-xs text-muted-foreground text-center">
          Last updated: {formatTime(lastUpdate)}
        </p>
      </CardContent>
    </Card>
  );
}

function HourlyForecastItem({ forecast }: { forecast: HourlyForecast }) {
  const Icon = WEATHER_ICONS[forecast.condition];
  const color = WEATHER_COLORS[forecast.condition];
  
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium w-16">
          {formatTime(forecast.time)}
        </span>
        <Icon className={cn('h-5 w-5', color)} />
        <span className="text-sm">{forecast.temperature}°C</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {forecast.precipitationProbability > 0 && (
          <span>{forecast.precipitationProbability}% rain</span>
        )}
        <span>{forecast.windSpeed} km/h</span>
      </div>
    </div>
  );
}