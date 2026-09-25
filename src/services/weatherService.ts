export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
}

export interface SaturdayForecast {
  dateStr: string;
  formattedDate: string;
  relativeLabel: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  windMax: number;
}

export interface ClujWeatherData {
  current: CurrentWeather;
  saturday: SaturdayForecast;
  updatedAt: string;
}

export function getWeatherCondition(code: number): {
  label: string;
  description: string;
  iconType: 'sun' | 'cloud' | 'rain' | 'cloud-rain' | 'snow' | 'storm' | 'fog';
} {
  switch (code) {
    case 0:
      return { label: 'Cer senin', description: 'Vreme însorită, cer complet senin', iconType: 'sun' };
    case 1:
      return { label: 'Predominant senin', description: 'Câțiva nori trecători', iconType: 'sun' };
    case 2:
      return { label: 'Parțial înnorat', description: 'Soare cu nori', iconType: 'cloud' };
    case 3:
      return { label: 'Înnorat', description: 'Cer acoperit de nori', iconType: 'cloud' };
    case 45:
    case 48:
      return { label: 'Ceață', description: 'Vizibilitate redusă din cauza ceții', iconType: 'fog' };
    case 51:
    case 53:
    case 55:
      return { label: 'Burniță', description: 'Precipitații slabe și mărunte', iconType: 'rain' };
    case 61:
    case 63:
      return { label: 'Ploaie', description: 'Ploaie moderată', iconType: 'rain' };
    case 65:
      return { label: 'Ploaie abundentă', description: 'Ploaie torențială', iconType: 'cloud-rain' };
    case 71:
    case 73:
    case 75:
      return { label: 'Ninsoare', description: 'Ninge în Cluj-Napoca', iconType: 'snow' };
    case 80:
    case 81:
    case 82:
      return { label: 'Averse de ploaie', description: 'Averse trecătoare', iconType: 'cloud-rain' };
    case 95:
    case 96:
    case 99:
      return { label: 'Furtună', description: 'Descărcări electrice și vijelie', iconType: 'storm' };
    default:
      return { label: 'Variabil', description: 'Vreme schimbătoare', iconType: 'cloud' };
  }
}

export async function fetchClujWeather(): Promise<ClujWeatherData> {
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=46.7712&longitude=23.6236&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=Europe%2FBucharest&forecast_days=14';

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Nu s-au putut prelua datele meteo pentru Cluj-Napoca.');
  }

  const data = await res.json();

  // Current weather
  const current: CurrentWeather = {
    temperature: Math.round(data.current.temperature_2m),
    apparentTemperature: Math.round(data.current.apparent_temperature),
    humidity: data.current.relative_humidity_2m,
    windSpeed: Math.round(data.current.wind_speed_10m),
    precipitation: data.current.precipitation,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
    time: data.current.time,
  };

  // Calculate upcoming Saturday
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
  // If today is Saturday (6), show today's Saturday. If Sunday (0), show next Saturday (in 6 days).
  const daysUntilSaturday = dayOfWeek === 6 ? 0 : 6 - dayOfWeek;

  const satDate = new Date(now);
  satDate.setDate(now.getDate() + daysUntilSaturday);

  // Format as YYYY-MM-DD in local time
  const y = satDate.getFullYear();
  const m = String(satDate.getMonth() + 1).padStart(2, '0');
  const d = String(satDate.getDate()).padStart(2, '0');
  const satDateStr = `${y}-${m}-${d}`;

  // Find index in daily.time
  const satIndex = data.daily.time.findIndex((t: string) => t === satDateStr);
  const targetIndex = satIndex >= 0 ? satIndex : 0;

  let relativeLabel = 'Sâmbăta care urmează';
  if (daysUntilSaturday === 0) {
    relativeLabel = 'Azi (Sâmbătă)';
  } else if (daysUntilSaturday === 1) {
    relativeLabel = 'Mâine (Sâmbătă)';
  } else {
    relativeLabel = `Sâmbătă (peste ${daysUntilSaturday} zile)`;
  }

  const formattedDate = satDate.toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const saturday: SaturdayForecast = {
    dateStr: satDateStr,
    formattedDate,
    relativeLabel,
    weatherCode: data.daily.weather_code[targetIndex] ?? 0,
    tempMax: Math.round(data.daily.temperature_2m_max[targetIndex] ?? 0),
    tempMin: Math.round(data.daily.temperature_2m_min[targetIndex] ?? 0),
    precipitationProbability: data.daily.precipitation_probability_max?.[targetIndex] ?? 0,
    windMax: Math.round(data.daily.wind_speed_10m_max[targetIndex] ?? 0),
  };

  return {
    current,
    saturday,
    updatedAt: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
  };
}
