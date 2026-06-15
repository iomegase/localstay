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
