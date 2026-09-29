import { LocalWeatherFeed } from '../types/weather';
import { SimulationState } from '../types';

export function getMockWeatherForecast(simulation: SimulationState): LocalWeatherFeed {
  const rain = simulation.rainfall;

  // Base metrics influenced by the active simulation
  let currentMmHr = 0;
  let advisory = 'Southwest Monsoon (Habagat) prevailing across Southern Metro Manila and Cavite coastal perimeter. Localized thunderstorm clouds active.';
  let runoffRisk: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' = 'LOW';

  if (rain === 'NONE') {
    currentMmHr = 0.2;
    advisory = 'Partly cloudy to overcast skies over Talon Dos. Normal evaporation and drainage gravity outflow operating at full capacity.';
    runoffRisk = 'LOW';
  } else if (rain === 'LIGHT') {
    currentMmHr = 4.8;
    advisory = 'Intermittent light monsoon drizzles recorded along Alabang-Zapote Road corridor. Sub-surface culverts absorbing road runoff steadily.';
    runoffRisk = 'LOW';
  } else if (rain === 'MODERATE') {
    currentMmHr = 16.5;
    advisory = 'Moderate convective rainfall cell traversing Talon Dos & BF Resort basin. Surface runoff entering arterial catch basins at 1.4 m³/sec.';
    runoffRisk = 'MODERATE';
  } else if (rain === 'HEAVY') {
    currentMmHr = 38.2;
    advisory = 'Heavy rainfall squall band active over Las Piñas watershed. Intense precipitation exceeding soil infiltration threshold; rapid surcharge of culvert inverts detected.';
    runoffRisk = 'ELEVATED';
  } else if (rain === 'TORRENTIAL') {
    currentMmHr = 64.5;
    advisory = 'ORANGE / RED HEAVY RAINFALL WARNING: Severe cloudburst cell stalling over Zapote River basin. High flood risk across low-lying Talon Dos roads.';
    runoffRisk = 'HIGH';
  }

  // Generate dynamic 6-hour forward forecast trend
  const hours = ['11:00 PM', '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM'];
  
  const hourlyTrends = hours.map((hour, idx) => {
    // Variation curve based on current rain
    const multiplier = [1.0, 1.25, 1.4, 0.9, 0.6, 0.4][idx];
    const precip = Math.max(0, Math.round((currentMmHr * multiplier) * 10) / 10);
    const prob = Math.min(98, Math.max(15, Math.round(precip > 20 ? 95 : precip > 10 ? 80 : precip > 3 ? 60 : 30)));
    
    let cond = 'Overcast';
    let icon: 'rain' | 'heavy-rain' | 'cloud' | 'thunder' | 'clear' = 'cloud';
    let risk: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' = 'LOW';

    if (precip >= 35) {
      cond = 'Severe Torrential Storm';
      icon = 'thunder';
      risk = 'HIGH';
    } else if (precip >= 20) {
      cond = 'Heavy Monsoon Downpour';
      icon = 'heavy-rain';
      risk = 'HIGH';
    } else if (precip >= 10) {
      cond = 'Moderate Showers';
      icon = 'rain';
      risk = 'ELEVATED';
    } else if (precip >= 2) {
      cond = 'Light Drizzle';
      icon = 'rain';
      risk = 'MODERATE';
    } else {
      cond = 'Partly Cloudy';
      icon = 'clear';
      risk = 'LOW';
    }

    return {
      time: hour,
      rainfallMmHr: precip,
      precipitationProb: prob,
      condition: cond,
      icon,
      runoffSurgeRisk: risk,
    };
  });

  return {
    stationName: 'PAGASA SANGLEY POINT / SCIENCE GARDEN RADAR',
    source: 'DOST-PAGASA Telemetry + Talon Dos Automated Weather Sensor',
    currentPrecipitationRateMmHr: currentMmHr,
    accumulatedRainfall24hMm: Math.round((currentMmHr * 3.8 + 24.5) * 10) / 10,
    hourlyTrends,
    tideCondition: {
      status: simulation.waterLevel >= 70 ? 'HIGH_TIDE' : 'RISING_TIDE',
      peakHeightMeters: 1.48,
      peakTime: '11:45 PM PHT',
      manilaBayBackwaterRisk: simulation.waterLevel >= 75 ? 'CRITICAL' : simulation.waterLevel >= 50 ? 'ELEVATED' : 'NOMINAL',
      explanation: 'High tide in Manila Bay creates backwater pressure on Zapote & Las Piñas River discharge sluices, slowing gravity drainage outflow from Talon Dos box culverts.',
    },
    synopticAdvisory: advisory,
    relativeHumidity: Math.min(99, 78 + Math.round(currentMmHr * 0.4)),
    windSpeedKph: Math.round(18 + currentMmHr * 0.35),
    windDirection: 'WSW (Habagat)',
    heatIndexC: 31.4,
    cloudCoverPercent: Math.min(100, 60 + Math.round(currentMmHr * 0.8)),
  };
}
