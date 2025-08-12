import { z } from 'zod';

// Weather API response schemas
const CurrentWeatherSchema = z.object({
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  windDirection: z.number(),
  pressure: z.number(),
  visibility: z.number(),
  uvIndex: z.number(),
  condition: z.enum(['clear', 'partly_cloudy', 'cloudy', 'light_rain', 'heavy_rain', 'storm', 'snow']),
  description: z.string(),
  icon: z.string(),
});

const HourlyForecastSchema = z.object({
  time: z.string(),
  temperature: z.number(),
  feelsLike: z.number(),
  precipitationProbability: z.number(),
  precipitationAmount: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  condition: z.enum(['clear', 'partly_cloudy', 'cloudy', 'light_rain', 'heavy_rain', 'storm', 'snow']),
  icon: z.string(),
});

const DailyForecastSchema = z.object({
  date: z.string(),
  temperatureMin: z.number(),
  temperatureMax: z.number(),
  precipitationProbability: z.number(),
  precipitationAmount: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  sunrise: z.string(),
  sunset: z.string(),
  condition: z.enum(['clear', 'partly_cloudy', 'cloudy', 'light_rain', 'heavy_rain', 'storm', 'snow']),
  description: z.string(),
  icon: z.string(),
});

const WeatherAlertSchema = z.object({
  id: z.string(),
  type: z.enum(['warning', 'watch', 'advisory']),
  severity: z.enum(['extreme', 'severe', 'moderate', 'minor']),
  title: z.string(),
  description: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  areas: z.array(z.string()),
});

export type CurrentWeather = z.infer<typeof CurrentWeatherSchema>;
export type HourlyForecast = z.infer<typeof HourlyForecastSchema>;
export type DailyForecast = z.infer<typeof DailyForecastSchema>;
export type WeatherAlert = z.infer<typeof WeatherAlertSchema>;

interface WeatherLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

interface WeatherOptions {
  units?: 'metric' | 'imperial';
  language?: string;
}

export class WeatherService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openweathermap.org/data/3.0';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get current weather conditions
   */
  async getCurrentWeather(
    location: WeatherLocation,
    options: WeatherOptions = {}
  ): Promise<CurrentWeather> {
    const { latitude, longitude } = location;
    const { units = 'metric', language = 'en' } = options;
    
    const url = new URL(`${this.baseUrl}/weather`);
    url.searchParams.append('lat', latitude.toString());
    url.searchParams.append('lon', longitude.toString());
    url.searchParams.append('appid', this.apiKey);
    url.searchParams.append('units', units);
    url.searchParams.append('lang', language);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return this.mapCurrentWeather(data);
  }

  /**
   * Get hourly forecast (next 48 hours)
   */
  async getHourlyForecast(
    location: WeatherLocation,
    options: WeatherOptions = {}
  ): Promise<HourlyForecast[]> {
    const { latitude, longitude } = location;
    const { units = 'metric', language = 'en' } = options;
    
    const url = new URL(`${this.baseUrl}/forecast/hourly`);
    url.searchParams.append('lat', latitude.toString());
    url.searchParams.append('lon', longitude.toString());
    url.searchParams.append('appid', this.apiKey);
    url.searchParams.append('units', units);
    url.searchParams.append('lang', language);
    url.searchParams.append('cnt', '48'); // 48 hours
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.list.map(this.mapHourlyForecast);
  }

  /**
   * Get daily forecast (next 7 days)
   */
  async getDailyForecast(
    location: WeatherLocation,
    options: WeatherOptions = {}
  ): Promise<DailyForecast[]> {
    const { latitude, longitude } = location;
    const { units = 'metric', language = 'en' } = options;
    
    const url = new URL(`${this.baseUrl}/forecast/daily`);
    url.searchParams.append('lat', latitude.toString());
    url.searchParams.append('lon', longitude.toString());
    url.searchParams.append('appid', this.apiKey);
    url.searchParams.append('units', units);
    url.searchParams.append('lang', language);
    url.searchParams.append('cnt', '7'); // 7 days
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.list.map(this.mapDailyForecast);
  }

  /**
   * Get weather alerts for location
   */
  async getWeatherAlerts(location: WeatherLocation): Promise<WeatherAlert[]> {
    const { latitude, longitude } = location;
    
    const url = new URL(`${this.baseUrl}/alerts`);
    url.searchParams.append('lat', latitude.toString());
    url.searchParams.append('lon', longitude.toString());
    url.searchParams.append('appid', this.apiKey);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.alerts || data.alerts.length === 0) {
      return [];
    }
    
    return data.alerts.map(this.mapWeatherAlert);
  }

  /**
   * Check if weather is suitable for outdoor event
   */
  assessOutdoorSuitability(weather: CurrentWeather | HourlyForecast): {
    suitable: boolean;
    concerns: string[];
    recommendations: string[];
  } {
    const concerns: string[] = [];
    const recommendations: string[] = [];
    
    // Temperature checks
    const temp = weather.temperature;
    const feelsLike = weather.feelsLike;
    
    if (temp < 10) {
      concerns.push('Cold temperature - guests may be uncomfortable');
      recommendations.push('Provide heating or blankets for guests');
    } else if (temp > 30) {
      concerns.push('Hot temperature - risk of heat exhaustion');
      recommendations.push('Ensure adequate shade and hydration stations');
    }
    
    if (Math.abs(feelsLike - temp) > 5) {
      concerns.push(`Feels like ${feelsLike}°C due to wind/humidity`);
    }
    
    // Wind checks
    if (weather.windSpeed > 30) {
      concerns.push('Strong winds - decorations and structures at risk');
      recommendations.push('Secure all decorations and consider wind barriers');
    } else if (weather.windSpeed > 20) {
      concerns.push('Moderate winds - lightweight items may blow away');
      recommendations.push('Weight down centerpieces and paper items');
    }
    
    // Precipitation checks
    if (weather.condition === 'heavy_rain' || weather.condition === 'storm') {
      concerns.push('Heavy rain or storms expected');
      recommendations.push('Have indoor backup plan ready');
    } else if (weather.condition === 'light_rain') {
      concerns.push('Light rain possible');
      recommendations.push('Provide umbrellas or covered areas');
    }
    
    // UV checks (for current weather)
    if ('uvIndex' in weather && weather.uvIndex > 7) {
      concerns.push('High UV index - sunburn risk');
      recommendations.push('Provide sunscreen and shaded areas');
    }
    
    // Humidity checks
    if (weather.humidity > 80) {
      concerns.push('High humidity - discomfort and makeup/hair issues');
      recommendations.push('Consider fans or indoor air-conditioned spaces');
    }
    
    const suitable = concerns.length === 0 || 
      (concerns.length === 1 && !concerns[0].includes('Heavy rain'));
    
    return { suitable, concerns, recommendations };
  }

  /**
   * Map API response to CurrentWeather
   */
  private mapCurrentWeather(data: any): CurrentWeather {
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      windDirection: data.wind.deg,
      pressure: data.main.pressure,
      visibility: data.visibility / 1000, // Convert to km
      uvIndex: data.uvi || 0,
      condition: this.mapWeatherCondition(data.weather[0].id),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    };
  }

  /**
   * Map API response to HourlyForecast
   */
  private mapHourlyForecast(data: any): HourlyForecast {
    return {
      time: new Date(data.dt * 1000).toISOString(),
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      precipitationProbability: Math.round((data.pop || 0) * 100),
      precipitationAmount: data.rain?.['1h'] || data.snow?.['1h'] || 0,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      condition: this.mapWeatherCondition(data.weather[0].id),
      icon: data.weather[0].icon,
    };
  }

  /**
   * Map API response to DailyForecast
   */
  private mapDailyForecast(data: any): DailyForecast {
    return {
      date: new Date(data.dt * 1000).toISOString(),
      temperatureMin: Math.round(data.temp.min),
      temperatureMax: Math.round(data.temp.max),
      precipitationProbability: Math.round((data.pop || 0) * 100),
      precipitationAmount: data.rain || data.snow || 0,
      humidity: data.humidity,
      windSpeed: Math.round(data.speed * 3.6), // Convert m/s to km/h
      sunrise: new Date(data.sunrise * 1000).toISOString(),
      sunset: new Date(data.sunset * 1000).toISOString(),
      condition: this.mapWeatherCondition(data.weather[0].id),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    };
  }

  /**
   * Map API response to WeatherAlert
   */
  private mapWeatherAlert(data: any): WeatherAlert {
    return {
      id: data.id || Math.random().toString(36),
      type: this.mapAlertType(data.event),
      severity: this.mapAlertSeverity(data.severity),
      title: data.event,
      description: data.description,
      startTime: new Date(data.start * 1000).toISOString(),
      endTime: new Date(data.end * 1000).toISOString(),
      areas: data.areas || [],
    };
  }

  /**
   * Map weather code to condition
   */
  private mapWeatherCondition(code: number): CurrentWeather['condition'] {
    if (code >= 200 && code < 300) return 'storm';
    if (code >= 300 && code < 400) return 'light_rain';
    if (code >= 500 && code < 600) {
      return code === 500 || code === 501 ? 'light_rain' : 'heavy_rain';
    }
    if (code >= 600 && code < 700) return 'snow';
    if (code === 800) return 'clear';
    if (code === 801 || code === 802) return 'partly_cloudy';
    return 'cloudy';
  }

  /**
   * Map alert event to type
   */
  private mapAlertType(event: string): WeatherAlert['type'] {
    const eventLower = event.toLowerCase();
    if (eventLower.includes('warning')) return 'warning';
    if (eventLower.includes('watch')) return 'watch';
    return 'advisory';
  }

  /**
   * Map alert severity
   */
  private mapAlertSeverity(severity: string): WeatherAlert['severity'] {
    const severityLower = severity?.toLowerCase() || '';
    if (severityLower.includes('extreme')) return 'extreme';
    if (severityLower.includes('severe')) return 'severe';
    if (severityLower.includes('minor')) return 'minor';
    return 'moderate';
  }
}

// Singleton instance
let weatherService: WeatherService | null = null;

export function getWeatherService(): WeatherService {
  if (!weatherService) {
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('Weather API key not configured');
    }
    weatherService = new WeatherService(apiKey);
  }
  return weatherService;
}