// Spec 084 AC-01 : photo de couverture du guide — page Guide, sinon page Logement, sinon générique.
export function guideCoverImage(
  guidePhotoUrl: string | null | undefined,
  showcasePhotos: Array<{ url: string; is_cover: boolean }>,
): string | null {
  const guidePhoto = guidePhotoUrl?.trim()
  if (guidePhoto) return guidePhoto
  return showcasePhotos.find(photo => photo.is_cover)?.url ?? showcasePhotos[0]?.url ?? null
}
