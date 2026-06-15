const FORBIDDEN_SCOPE_PATTERNS = [
  /coordonn(?:e|é)es?/i,
  /\bgps\b/i,
  /distance/i,
  /dur(?:e|é)e/i,
  /prix/i,
  /disponibilit(?:e|é)s?/i,
  /temps r(?:e|é)el/i,
  /horaire/i,
  /statistique/i,
  /\b(?:s['’]appelle|se nomme)\b/i,
  /\b(?:personne|habitant(?:s)?|villageois(?:es)?)\b.*\b(?:violent(?:e|s)?|voleur(?:se)?s?|vol(?:e|é|er)?|agress(?:ion|if|ive|er)?|arnaque|escroquerie)\b/i,
  /\baurait\b.*\b(?:vol(?:e|é|er)?|agress(?:ion|er)?|escroqu(?:é|er)?|arnaqu(?:é|er)?)\b/i,
] as const

export function assertBlogGeminiScope(input: {
  brief: string
  verifiedFacts: string
}): void {
  const source = `${input.brief}\n${input.verifiedFacts}`
  if (FORBIDDEN_SCOPE_PATTERNS.some(pattern => pattern.test(source))) {
    throw new Error('FORBIDDEN_SCOPE')
  }
}
