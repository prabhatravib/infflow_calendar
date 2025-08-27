import { fetchWeatherData } from '../api';

interface WeatherCache {
  data: any;
  timestamp: number;
  location: string;
}

class WeatherService {
  private cache: WeatherCache | null = null;
  private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  private fetchPromise: Promise<any> | null = null;

  async getWeather(location: string): Promise<any> {
    // Check if we have valid cached data for this location
    if (this.isCacheValid(location)) {
      console.log('Using cached weather data for:', location);
      return this.cache!.data;
    }

    // If there's already a fetch in progress, wait for it
    if (this.fetchPromise) {
      console.log('Weather fetch already in progress, waiting...');
      return await this.fetchPromise;
    }

    // Fetch new weather data
    console.log('Fetching fresh weather data for:', location);
    this.fetchPromise = this.fetchAndCache(location);
    
    try {
      const result = await this.fetchPromise;
      return result;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async fetchAndCache(location: string): Promise<any> {
    try {
      const weatherData = await fetchWeatherData(location);
      
      // Cache the new data
      this.cache = {
        data: weatherData,
        timestamp: Date.now(),
        location: location
      };

      console.log('Weather data cached successfully for:', location);
      return weatherData;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      
      // If we have stale cache data, return it as fallback
      if (this.cache && this.cache.location === location) {
        console.log('Using stale cached weather data as fallback');
        return this.cache.data;
      }
      
      throw error;
    }
  }

  private isCacheValid(location: string): boolean {
    if (!this.cache || this.cache.location !== location) {
      return false;
    }

    const now = Date.now();
    const cacheAge = now - this.cache.timestamp;
    
    return cacheAge < this.CACHE_DURATION;
  }

  // Force refresh weather data (useful for location changes)
  async refreshWeather(location: string): Promise<any> {
    console.log('Forcing weather refresh for:', location);
    this.cache = null; // Clear cache
    return await this.getWeather(location);
  }

  // Get cache status for debugging
  getCacheStatus(): { hasCache: boolean; age: number; location: string } | null {
    if (!this.cache) {
      return null;
    }

    return {
      hasCache: true,
      age: Date.now() - this.cache.timestamp,
      location: this.cache.location
    };
  }
}

// Export a singleton instance
export const weatherService = new WeatherService();
