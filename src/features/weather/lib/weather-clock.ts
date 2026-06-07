export function formatWeatherClockLabel(timeZone: string, date: Date = new Date()) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    timeZone,
  }).format(date)
}
