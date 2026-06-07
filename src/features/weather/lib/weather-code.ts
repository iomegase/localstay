import type { WeatherIconKind } from '../types'

type WeatherCodeDisplay = {
  label: string
  icon: WeatherIconKind
}

export function getWeatherCodeDisplay(code: number): WeatherCodeDisplay {
  if (code === 0) return { label: 'Ciel clair', icon: 'sun' }
  if ([1, 2].includes(code)) return { label: 'Peu nuageux', icon: 'partly-cloudy' }
  if (code === 3) return { label: 'Couvert', icon: 'cloud' }
  if ([45, 48].includes(code)) return { label: 'Brouillard', icon: 'fog' }
  if ([51, 53, 55].includes(code)) return { label: 'Bruine', icon: 'rain' }
  if ([56, 57].includes(code)) return { label: 'Bruine verglaçante', icon: 'rain' }
  if (code === 61) return { label: 'Pluie faible', icon: 'rain' }
  if (code === 63) return { label: 'Pluie modérée', icon: 'rain' }
  if (code === 65) return { label: 'Pluie forte', icon: 'rain' }
  if ([66, 67].includes(code)) return { label: 'Pluie verglaçante', icon: 'rain' }
  if (code === 71) return { label: 'Neige légère', icon: 'snow' }
  if (code === 73) return { label: 'Neige modérée', icon: 'snow' }
  if (code === 75) return { label: 'Neige forte', icon: 'snow' }
  if (code === 77) return { label: 'Grains de neige', icon: 'snow' }
  if ([80, 81, 82].includes(code)) return { label: 'Averses', icon: 'rain' }
  if ([85, 86].includes(code)) return { label: 'Averses de neige', icon: 'snow' }
  if (code === 95) return { label: 'Orage', icon: 'thunderstorm' }
  if ([96, 99].includes(code)) return { label: 'Orage fort', icon: 'storm' }
  return { label: 'Météo variable', icon: 'cloud' }
}
