import React, { useState, useEffect } from 'react';
import {
  fetchClujWeather,
  ClujWeatherData,
  getWeatherCondition,
} from '../services/weatherService';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Wind,
  Umbrella,
  Compass,
  RefreshCw,
} from 'lucide-react';

export const WeatherCluj: React.FC = () => {
  const [weather, setWeather] = useState<ClujWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchClujWeather();
      setWeather(data);
    } catch (err: any) {
      setError(err?.message || 'Nu s-a putut încărca prognoza meteo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
    // Auto-refresh weather every 10 minutes
    const interval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const renderWeatherIcon = (
    iconType: string,
    className: string = 'w-8 h-8 text-amber-400'
  ) => {
    switch (iconType) {
      case 'sun':
        return <Sun className={className} />;
      case 'cloud':
        return <Cloud className={className} />;
      case 'rain':
      case 'cloud-rain':
        return <CloudRain className={className} />;
      case 'storm':
        return <CloudLightning className={className} />;
      case 'snow':
        return <CloudSnow className={className} />;
      case 'fog':
        return <CloudFog className={className} />;
      default:
        return <Cloud className={className} />;
    }
  };

  if (loading && !weather) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#0c1017] border border-slate-800 shadow-xl space-y-3">
        <RefreshCw className="w-6 h-6 text-red-500 animate-spin mx-auto" />
        <p className="text-sm text-slate-300">Se preia starea vremii pentru Cluj-Napoca...</p>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[#0c1017] border border-red-900/60 shadow-xl space-y-3">
        <p className="text-sm text-red-300">{error}</p>
        <button
          onClick={loadWeather}
          className="px-4 py-2 rounded-xl bg-slate-900 text-xs text-white border border-slate-700 cursor-pointer"
        >
          Reîncearcă
        </button>
      </div>
    );
  }

  if (!weather) return null;

  const saturdayCondition = getWeatherCondition(weather.saturday.weatherCode);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* VREMEA DE SÂMBĂTĂ (ACTIVITATEA DE PATRULĂ) */}
      <section className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0e1420] via-[#0c1017] to-[#120a0d] border border-red-900/40 shadow-2xl relative overflow-hidden space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-serif-title">
              Prognoză Sâmbătă · Cluj-Napoca
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-600 text-white shadow-sm">
              {weather.saturday.relativeLabel}
            </span>

            <button
              onClick={loadWeather}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Actualizează prognoza"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {renderWeatherIcon(saturdayCondition.iconType, 'w-12 h-12 text-amber-400 shrink-0')}
              <div>
                <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {weather.saturday.tempMax}°C
                </span>
                <span className="text-sm text-slate-400 font-medium ml-2">
                  / min. {weather.saturday.tempMin}°C
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              <p className="text-base font-bold text-white capitalize">
                {saturdayCondition.label}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                {weather.saturday.formattedDate}
              </p>
            </div>
          </div>

          {/* Quick Metrics for Saturday */}
          <div className="grid grid-cols-2 gap-2.5 sm:w-64">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
              <Umbrella className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Precipitații</span>
                <span className="text-xs font-bold text-white">
                  {weather.saturday.precipitationProbability}%
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
              <Wind className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Vânt max.</span>
                <span className="text-xs font-bold text-white">
                  {weather.saturday.windMax} km/h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scout Activity Advice */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 flex items-center gap-2.5">
          <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {weather.saturday.precipitationProbability > 40
              ? 'Atenție: Șanse de ploaie pentru sâmbătă! Recomandat pelerină și bocanci impermeabili.'
              : weather.saturday.tempMax > 22
              ? 'Vreme caldă și prielnică pentru ieșiri și activități de patrulă în aer liber.'
              : 'Condiții bune pentru ieșirea de patrulă. Pregătiți echipamentul de munte corespunzător.'}
          </span>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80">
          <span>Date meteo furnizate prin Open-Meteo</span>
          <span>Actualizat la {weather.updatedAt}</span>
        </div>
      </section>
    </div>
  );
};
