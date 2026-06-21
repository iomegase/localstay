export type AmenityCatalogItem = { code: string; label: string; availability: 'included' | 'on_request' }

export const AMENITY_CATALOG: AmenityCatalogItem[] = [
  // Équipements (compris)
  { code: 'wifi', label: 'Wi-Fi', availability: 'included' },
  { code: 'parking', label: 'Parking', availability: 'included' },
  { code: 'kitchen_equipped', label: 'Cuisine équipée', availability: 'included' },
  { code: 'dishwasher', label: 'Lave-vaisselle', availability: 'included' },
  { code: 'washer', label: 'Lave-linge', availability: 'included' },
  { code: 'tv', label: 'Télévision', availability: 'included' },
  { code: 'fireplace', label: 'Cheminée', availability: 'included' },
  { code: 'pool', label: 'Piscine', availability: 'included' },
  { code: 'jacuzzi', label: 'Jacuzzi', availability: 'included' },
  { code: 'sauna', label: 'Sauna', availability: 'included' },
  { code: 'hammam', label: 'Hammam', availability: 'included' },
  { code: 'cinema', label: 'Salle de cinéma', availability: 'included' },
  { code: 'fitness', label: 'Salle de sport', availability: 'included' },
  { code: 'air_conditioning', label: 'Climatisation', availability: 'included' },
  { code: 'heating', label: 'Chauffage', availability: 'included' },
  { code: 'terrace', label: 'Terrasse / Balcon', availability: 'included' },
  { code: 'garden', label: 'Jardin', availability: 'included' },
  { code: 'mountain_view', label: 'Vue montagne', availability: 'included' },
  { code: 'ski_in_out', label: 'Ski-in / ski-out', availability: 'included' },
  { code: 'ev_charger', label: 'Borne de recharge VE', availability: 'included' },
  { code: 'pets_allowed', label: 'Animaux acceptés', availability: 'included' },
  { code: 'baby_equipment', label: 'Équipement bébé', availability: 'included' },
  // Services (sur demande)
  { code: 'chef', label: 'Chef privé', availability: 'on_request' },
  { code: 'breakfast', label: 'Petit-déjeuner', availability: 'on_request' },
  { code: 'airport_transfer', label: 'Transfert aéroport', availability: 'on_request' },
  { code: 'cleaning', label: 'Ménage', availability: 'on_request' },
  { code: 'concierge', label: 'Conciergerie', availability: 'on_request' },
  { code: 'spa_massage', label: 'Massage / Spa', availability: 'on_request' },
  { code: 'childcare', label: "Garde d'enfants", availability: 'on_request' },
  { code: 'equipment_rental', label: 'Location de matériel', availability: 'on_request' },
  { code: 'grocery', label: "Courses à l'arrivée", availability: 'on_request' },
]

export const AMENITY_CATALOG_CODES = new Set(AMENITY_CATALOG.map(item => item.code))
