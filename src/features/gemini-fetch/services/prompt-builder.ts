export interface PromptParams {
  cityName: string
  postalCode: string
  categoryName: string
  radiusKm: number
}

export function buildGeminiPrompt(params: PromptParams): string {
  const { cityName, postalCode, categoryName, radiusKm } = params
  return `Tu es un expert local de la ville de ${cityName} (${postalCode}), France.

Ta mission est de DEUX types :
1. Lister TOUS les établissements existants de la catégorie "${categoryName}" dans cette ville et ses alentours (${radiusKm} km).
   Ne filtre pas selon ta préférence — liste exhaustivement ce qui existe réellement.
2. Pour chaque établissement, rédiger une description courte (2-3 phrases) en français,
   mettant en valeur ce qui le rend unique, son ambiance, ses spécialités.

Critères de liste :
- Établissements réellement existants et actifs
- Dans un rayon de ${radiusKm} km du centre de ${cityName}
- Sans doublons
- Sans établissements définitivement fermés
- Maximum 20 établissements

Format de réponse STRICT (JSON uniquement, aucun texte avant ou après) :
{
  "pois": [
    {
      "name": "string",
      "address": "string",
      "phone": "string | null",
      "website": "string | null",
      "description": "string — 2 à 3 phrases rédigées, ton local et chaleureux",
      "subcategory": "string | null",
      "hours": { "mon": "09:00-19:00", "tue": "09:00-19:00", ... } | null,
      "tags": ["tag1", "tag2"]
    }
  ]
}

NE PAS inclure : latitude, longitude, rating, rating_count, photos.
Ces données sont gérées par d'autres services.`
}
