export interface WeatherHourlyForecast {
  time: string; // e.g. "11:00 PM"
  rainfallMmHr: number;
  precipitationProb: number; // 0 - 100%
  condition: string; // e.g. "Scattered Showers", "Habagat Monsoon Squall", "Overcast"
  icon: 'rain' | 'heavy-rain' | 'cloud' | 'thunder' | 'clear';
  runoffSurgeRisk: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
}

export interface LocalWeatherFeed {
  stationName: string;
  source: string; // e.g. "PAGASA Synoptic Radar // Science Garden / Sangley Point"
  currentPrecipitationRateMmHr: number;
  accumulatedRainfall24hMm: number;
  hourlyTrends: WeatherHourlyForecast[];
  tideCondition: {
    status: 'RISING_TIDE' | 'HIGH_TIDE' | 'EBBING_TIDE' | 'LOW_TIDE';
    peakHeightMeters: number;
    peakTime: string;
    manilaBayBackwaterRisk: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
    explanation: string;
  };
  synopticAdvisory: string;
  relativeHumidity: number;
  windSpeedKph: number;
  windDirection: string;
  heatIndexC: number;
  cloudCoverPercent: number;
}
