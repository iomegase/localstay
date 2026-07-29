export type Property = {
  slug: string;
  place: string;
  name: string;
  eyebrow: string;
  description: string;
  longDescription: string[];
  image: string;
  gallery: string[];
  stats: {
    surface: string;
    travelers: string;
    bedrooms: string;
    bathrooms: string;
  };
  facts: {
    label: string;
    value: string;
  }[];
  sleeping: string[];
  amenities: string[];
  services?: string[];
  surroundings?: string;
  distances?: {
    label: string;
    value: string;
  }[];
  rules?: string[];
  minimumStay?: string;
  startingPrice?: string;
  airbnbUrl: string;
};

export const properties: Property[] = [
  {
    slug: "le-refuge-des-cimes",
    place: "Saint-Gervais-les-Bains",
    name: "Le Refuge des Cimes",
    eyebrow: "Chalet avec vue sur les sommets",
    description:
      "Un chalet chaleureux avec terrasse, cheminée et vue ouverte sur les sommets.",
    longDescription: [
      "Pensé pour les séjours en famille ou entre amis, Le Refuge des Cimes réunit de beaux volumes, une atmosphère chaleureuse et une vue dégagée sur les montagnes.",
      "Le vaste séjour s’organise autour de la cheminée, tandis que la terrasse permet de profiter pleinement du calme et du paysage. Chaque chambre offre un espace confortable pour se retrouver après une journée en altitude.",
    ],
    image: "/hero-chalet.png",
    gallery: ["/hero-chalet.png", "/guide-interior.png", "/hero-chalet.png"],
    stats: { surface: "180 m²", travelers: "11", bedrooms: "5", bathrooms: "2" },
    facts: [
      { label: "Type de logement", value: "Chalet entier" },
      { label: "Capacité", value: "11 voyageurs" },
      { label: "Chambres", value: "5 chambres" },
      { label: "Salles de bain", value: "2 salles de bain" },
      { label: "Arrivée", value: "À partir de 16 h" },
      { label: "Départ", value: "Avant 10 h" },
    ],
    sleeping: ["3 chambres avec lit double", "1 chambre avec 3 lits simples", "1 chambre avec 2 lits simples"],
    amenities: ["Cheminée", "Terrasse", "Vue montagne", "Cuisine équipée", "Wi-Fi", "Parking privé", "Lave-linge", "Local à skis"],
    airbnbUrl: "https://www.airbnb.fr/",
  },
  {
    slug: "appartement-du-lac",
    place: "Annecy",
    name: "L’Appartement du Lac",
    eyebrow: "Appartement lumineux près du lac",
    description:
      "Une adresse lumineuse, pensée pour profiter du lac et rejoindre la vieille ville à pied.",
    longDescription: [
      "Cet appartement lumineux offre un point de départ idéal pour découvrir Annecy à pied. Le lac, les commerces et la vieille ville se trouvent à proximité.",
      "Son séjour ouvert, ses deux chambres et sa cuisine équipée composent une adresse pratique et confortable pour quatre voyageurs.",
    ],
    image: "/guide-interior.png",
    gallery: ["/guide-interior.png", "/hero-chalet.png", "/guide-interior.png"],
    stats: { surface: "82 m²", travelers: "4", bedrooms: "2", bathrooms: "1" },
    facts: [
      { label: "Type de logement", value: "Appartement entier" },
      { label: "Capacité", value: "4 voyageurs" },
      { label: "Chambres", value: "2 chambres" },
      { label: "Salle de bain", value: "1 salle de bain" },
      { label: "Arrivée", value: "À partir de 16 h" },
      { label: "Départ", value: "Avant 10 h" },
    ],
    sleeping: ["1 chambre avec lit double", "1 chambre avec 2 lits simples"],
    amenities: ["À proximité du lac", "Cuisine équipée", "Wi-Fi", "Lave-linge", "Télévision", "Linge de maison"],
    airbnbUrl: "https://www.airbnb.fr/",
  },
  {
    slug: "chalet-hygge",
    place: "Saint-Gervais-les-Bains",
    name: "Chalet Hygge",
    eyebrow: "Chalet cosy avec piscine, terrasse et vue panoramique",
    description:
      "Un chalet chaleureux où l’authenticité alpine rencontre le confort moderne.",
    longDescription: [
      "Entièrement habillé de bois, Chalet Hygge séduit par son atmosphère cocooning, ses beaux volumes et sa vue imprenable sur les montagnes. La pièce de vie baignée de lumière s’ouvre largement sur l’extérieur et réunit un salon confortable, un espace repas convivial et une cuisine entièrement équipée.",
      "La vaste terrasse en bois invite à profiter du panorama, à partager un repas autour du barbecue ou à se détendre dans les espaces lounge. En juillet et août, la piscine extérieure chauffée prolonge cette parenthèse de sérénité.",
      "Pensé pour les familles et les séjours entre amis, le chalet offre une ambiance chaleureuse, un cadre calme et tout le confort nécessaire pour profiter pleinement de Saint-Gervais et de ses montagnes.",
    ],
    image: "https://cdn.sanity.io/images/4s1z0bj2/production/d435a89c6e3c01c91fd7565c174396215e91a3dd-4000x2667.webp",
    gallery: [
      "https://cdn.sanity.io/images/4s1z0bj2/production/d435a89c6e3c01c91fd7565c174396215e91a3dd-4000x2667.webp",
      "https://cdn.sanity.io/images/4s1z0bj2/production/6011587dfd16800c5d723c9cedf9f5c423f9e667-4000x2667.webp",
      "https://cdn.sanity.io/images/4s1z0bj2/production/25dc6be90c71b3db4bca0f066dca76e07a0db359-4000x2666.webp",
    ],
    stats: { surface: "170 m²", travelers: "6", bedrooms: "3", bathrooms: "2" },
    facts: [
      { label: "Type de logement", value: "Chalet entier" },
      { label: "Capacité", value: "6 voyageurs" },
      { label: "Chambres", value: "3 chambres" },
      { label: "Salles de bain", value: "2 salles de bain" },
      { label: "Arrivée", value: "À partir de 16 h" },
      { label: "Départ", value: "Avant 10 h" },
    ],
    sleeping: [
      "Chambre 1 : lit double et salle de bain privative",
      "Chambre 2 : lit double",
      "Chambre 3 : 2 lits jumeaux",
      "Une salle de bain et un toilette supplémentaires à l’étage",
      "Un toilette au rez-de-chaussée",
    ],
    amenities: [
      "Wi-Fi haut débit",
      "Parking privé",
      "Borne de recharge électrique",
      "Barbecue",
      "Piscine extérieure chauffée",
      "Vidéoprojecteur",
      "Cuisine entièrement équipée",
      "Linge et serviettes fournis",
    ],
    services: [
      "Transferts privés",
      "Chef à domicile",
      "Séances de yoga",
      "Petits déjeuners",
      "Cours de ski",
      "Forfaits de ski",
    ],
    surroundings:
      "Niché sur les hauteurs de Saint-Gervais, le chalet profite d’un environnement calme et naturel tout en restant proche du village. La gare du Tramway du Mont-Blanc permet de rejoindre facilement le domaine skiable des Houches. Commerces, restaurants, bars, cinéma et télécabines restent accessibles pour profiter de la destination en toute simplicité.",
    distances: [
      { label: "Tramway du Mont-Blanc", value: "10 min à pied" },
      { label: "Pistes", value: "15 min" },
      { label: "Supermarché", value: "15 min" },
      { label: "Gare", value: "25 min" },
      { label: "Aéroport", value: "75 min" },
    ],
    rules: [
      "Check-in 16 h · Check-out 10 h",
      "Animaux sur demande",
      "Caution demandée",
      "Logement non-fumeur",
      "Fêtes interdites",
    ],
    minimumStay: "5 nuits minimum",
    startingPrice: "À partir de 500 € / nuit",
    airbnbUrl: "https://www.airbnb.fr/",
  },
  {
    slug: "la-suite-du-village",
    place: "Megève",
    name: "La Suite du Village",
    eyebrow: "Un cocon au cœur de Megève",
    description:
      "Un cocon élégant au cœur du village, idéal pour une escapade à deux.",
    longDescription: [
      "Cette suite élégante permet de profiter de Megève à pied, dans une atmosphère intime et confortable.",
      "Son espace nuit, sa salle de bain soignée et son coin repas en font un pied-à-terre idéal pour deux voyageurs.",
    ],
    image: "/guide-interior.png",
    gallery: ["/guide-interior.png", "/hero-chalet.png", "/guide-interior.png"],
    stats: { surface: "48 m²", travelers: "2", bedrooms: "1", bathrooms: "1" },
    facts: [
      { label: "Type de logement", value: "Appartement entier" },
      { label: "Capacité", value: "2 voyageurs" },
      { label: "Chambre", value: "1 chambre" },
      { label: "Salle de bain", value: "1 salle de bain" },
      { label: "Arrivée", value: "À partir de 16 h" },
      { label: "Départ", value: "Avant 10 h" },
    ],
    sleeping: ["1 chambre avec lit double"],
    amenities: ["Centre-village", "Wi-Fi", "Cuisine équipée", "Télévision", "Linge de maison"],
    airbnbUrl: "https://www.airbnb.fr/",
  },
  {
    slug: "les-epiceas",
    place: "La Clusaz",
    name: "Les Épicéas",
    eyebrow: "Un séjour au plus près des pistes",
    description:
      "Un appartement confortable à proximité des pistes et des sentiers du village.",
    longDescription: [
      "Les Épicéas offre une adresse simple et confortable pour profiter de La Clusaz en toute saison.",
      "Deux chambres, une cuisine équipée et un séjour convivial permettent d’accueillir jusqu’à cinq voyageurs.",
    ],
    image: "/hero-chalet.png",
    gallery: ["/hero-chalet.png", "/guide-interior.png", "/hero-chalet.png"],
    stats: { surface: "76 m²", travelers: "5", bedrooms: "2", bathrooms: "2" },
    facts: [
      { label: "Type de logement", value: "Appartement entier" },
      { label: "Capacité", value: "5 voyageurs" },
      { label: "Chambres", value: "2 chambres" },
      { label: "Salles de bain", value: "2 salles de bain" },
      { label: "Arrivée", value: "À partir de 16 h" },
      { label: "Départ", value: "Avant 10 h" },
    ],
    sleeping: ["1 chambre avec lit double", "1 chambre avec 3 lits simples"],
    amenities: ["Proche des pistes", "Balcon", "Cuisine équipée", "Wi-Fi", "Parking", "Local à skis"],
    airbnbUrl: "https://www.airbnb.fr/",
  },
  {
    slug: "la-maison-bleue",
    place: "Talloires",
    name: "La Maison Bleue",
    eyebrow: "Entre lac et montagne",
    description:
      "Une maison paisible entre lac et montagne, avec jardin et espaces généreux.",
    longDescription: [
      "La Maison Bleue offre un cadre paisible à proximité du lac d’Annecy, avec un jardin et de beaux espaces pour six voyageurs.",
      "Sa pièce de vie lumineuse, ses trois chambres et ses extérieurs en font une adresse idéale pour ralentir et explorer les environs.",
    ],
    image: "/guide-interior.png",
    gallery: ["/guide-interior.png", "/hero-chalet.png", "/guide-interior.png"],
    stats: { surface: "135 m²", travelers: "6", bedrooms: "3", bathrooms: "2" },
    facts: [
      { label: "Type de logement", value: "Maison entière" },
      { label: "Capacité", value: "6 voyageurs" },
      { label: "Chambres", value: "3 chambres" },
      { label: "Salles de bain", value: "2 salles de bain" },
      { label: "Arrivée", value: "À partir de 16 h" },
      { label: "Départ", value: "Avant 10 h" },
    ],
    sleeping: ["2 chambres avec lit double", "1 chambre avec 2 lits simples"],
    amenities: ["Jardin", "Vue montagne", "Cuisine équipée", "Wi-Fi", "Parking privé", "Lave-linge"],
    airbnbUrl: "https://www.airbnb.fr/",
  },
];

export function getProperty(slug: string) {
  return properties.find((property) => property.slug === slug);
}
