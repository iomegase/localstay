export type WeatherIconKind =
  | 'sun'
  | 'partly-cloudy'
  | 'cloud'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'wind'
  | 'storm'
  | 'thunderstorm'

export type WeatherCurrent = {
  time: string
  timeLabel: string
  dateLabel: string
  temperature: number
  condition: string
  icon: WeatherIconKind
  windSpeed: number
  precipitation: number
}

export type WeatherHour = {
  time: string
  hourLabel: string
  temperature: number
  weatherCode: number
  condition: string
  icon: WeatherIconKind
  precipitationProbability: number
}

export type WeatherDay = {
  date: string
  dayLabel: string
  condition: string
  icon: WeatherIconKind
  temperatureMax: number
  temperatureMin: number
  precipitationProbability: number
}

export type WeatherForecast = {
  timezone: string
  current: WeatherCurrent
  hourly: WeatherHour[]
  daily: WeatherDay[]
}
