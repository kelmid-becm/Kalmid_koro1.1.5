import { AppTranslations } from '../locales/translations';
import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Loader2, RefreshCw } from 'lucide-react';

export interface WeatherData {
  temperature_2m: number;
  weather_code: number;
}

export const WeatherWidget = ({ t, language }: { t: AppTranslations, language: string }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchWeather = async () => {
    setLoading(true);
    setError(false);
    try {
      // Use relatively stable geolocation/weather api
      const pos: GeolocationPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      const { latitude, longitude } = pos.coords;
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`);
      if (!res.ok) throw new Error("Failed to fetch weather");
      const data = await res.json();
      setWeather(data.current);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className="w-8 h-8 text-yellow-400" />;
    if (code <= 48) return <Cloud className="w-8 h-8 text-zinc-400" />;
    return <CloudRain className="w-8 h-8 text-blue-400" />;
  };

  const getWeatherText = (code: number) => {
    if (code <= 3) return t.clearWeather;
    if (code <= 48) return t.cloudyWeather;
    return t.rainyWeather;
  };

  if (loading) {
    return (
      <div className="p-4 rounded-[2rem] border flex items-center justify-center min-h-[120px] transition-colors" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-[2rem] border flex flex-col items-center justify-center min-h-[120px] transition-colors" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
        <span className="text-sm mb-2" style={{ color: 'var(--color-dim)' }}>{t.weatherUnavailable}</span>
        <button onClick={fetchWeather} className="p-2 text-indigo-400 hover:text-indigo-500 rounded-full hover:bg-zinc-800/10"><RefreshCw className="w-4 h-4" /></button>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="p-6 rounded-[2rem] border transition-colors flex items-center justify-between shadow-lg" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          {getWeatherIcon(weather.weather_code)}
        </div>
        <div>
          <h4 className="text-2xl font-bold" style={{ color: 'var(--color-base)' }}>{Math.round(weather.temperature_2m)}°C</h4>
          <p className="text-sm font-medium" style={{ color: 'var(--color-dim)' }}>{getWeatherText(weather.weather_code)}</p>
        </div>
      </div>
      <div>
        <button onClick={fetchWeather} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
