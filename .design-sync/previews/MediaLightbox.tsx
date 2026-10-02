import { MediaLightbox } from '@mystay/design-system'

const H = 'https://www.mystay.city'

export const Photos = () => (
  <div className="relative h-[640px] w-[375px] overflow-hidden bg-[#F6F6F4]">
    <MediaLightbox
      title="Accéder au logement"
      content={{ kind: 'photos', photos: [`${H}/demo/acces-logement-trousseau.webp`, `${H}/demo/entree-batiment-interphone.webp`], startIndex: 0 }}
      onClose={() => {}}
    />
  </div>
)
