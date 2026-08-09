export function isGuideMenuEnabled(
  environment = process.env.NODE_ENV,
): boolean {
  return environment !== 'production'
}

