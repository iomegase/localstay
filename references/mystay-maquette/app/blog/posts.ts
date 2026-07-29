export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  readingTime: string;
  publishedAt: string;
  introduction: string;
  highlights: string[];
  sections: {
    title: string;
    paragraphs: string[];
  }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "reussir-arrivee-voyageurs",
    category: "Accueil digital",
    title: "Réussir l’arrivée de vos voyageurs",
    excerpt:
      "Les informations à transmettre avant le séjour pour rendre l’arrivée simple, autonome et rassurante.",
    image: "/guide-interior.png",
    readingTime: "5 min",
    publishedAt: "24 juillet 2026",
    introduction:
      "Une arrivée réussie commence bien avant la remise des clés. Plus les informations sont claires et accessibles, plus le voyageur peut se projeter sereinement dans son séjour.",
    highlights: [
      "Rassembler les accès dans un seul lien",
      "Envoyer les informations avant le départ",
      "Rester disponible pour les vrais besoins",
    ],
    sections: [
      {
        title: "Anticiper les questions essentielles",
        paragraphs: [
          "Adresse précise, stationnement, horaires, accès au logement et coordonnées du contact local doivent être réunis au même endroit. Le voyageur ne devrait jamais avoir à rechercher une information dans une longue conversation.",
          "Un message envoyé quelques jours avant l’arrivée permet également de confirmer le nombre de voyageurs et de rappeler les particularités du logement.",
        ],
      },
      {
        title: "Créer un parcours simple",
        paragraphs: [
          "Le guide MyStay organise les informations selon le moment du séjour. Les accès sont visibles en priorité avant l’arrivée, puis les équipements et recommandations prennent naturellement le relais.",
        ],
      },
    ],
  },
  {
    slug: "valoriser-chalet-location",
    category: "Propriétaires",
    title: "Valoriser un chalet avant sa mise en location",
    excerpt:
      "Photographies, présentation et détails pratiques : les fondamentaux d’une annonce qui inspire confiance.",
    image: "/hero-chalet.png",
    readingTime: "7 min",
    publishedAt: "18 juillet 2026",
    introduction:
      "La qualité perçue d’un logement se joue dès les premières images. Une présentation cohérente permet d’attirer les bons voyageurs et de mieux défendre la valeur du séjour.",
    highlights: [
      "Photographier les usages, pas seulement les pièces",
      "Présenter chaque équipement avec précision",
      "Créer une promesse fidèle à l’expérience",
    ],
    sections: [
      {
        title: "Montrer le caractère du lieu",
        paragraphs: [
          "La lumière, les volumes et les vues doivent guider la séance photo. Il ne s’agit pas seulement de documenter les pièces, mais de raconter la façon dont le logement se vit.",
          "Quelques détails choisis — une table dressée, un feu de cheminée ou une terrasse prête à accueillir — donnent immédiatement une échelle humaine au bien.",
        ],
      },
      {
        title: "Rester précis dans la description",
        paragraphs: [
          "Une description élégante reste factuelle. Elle présente les couchages, les équipements, l’environnement et les éventuelles contraintes sans promesse excessive.",
        ],
      },
    ],
  },
  {
    slug: "saint-gervais-adresses-sejour",
    category: "Destination",
    title: "Saint-Gervais, nos adresses pour un séjour réussi",
    excerpt:
      "Balades, bonnes tables et expériences locales sélectionnées autour du massif du Mont-Blanc.",
    image:
      "https://cdn.sanity.io/images/4s1z0bj2/production/d435a89c6e3c01c91fd7565c174396215e91a3dd-4000x2667.webp",
    readingTime: "6 min",
    publishedAt: "11 juillet 2026",
    introduction:
      "Saint-Gervais se découvre autant par ses paysages que par ses adresses. Voici une sélection volontairement courte, pensée pour profiter de la destination sans transformer le séjour en programme minuté.",
    highlights: [
      "Sélectionner peu d’adresses, mais les connaître",
      "Adapter les conseils à la saison",
      "Privilégier les expériences vraiment locales",
    ],
    sections: [
      {
        title: "Prendre de la hauteur",
        paragraphs: [
          "Le Tramway du Mont-Blanc offre une première découverte spectaculaire du territoire. Pour une marche plus intimiste, les sentiers de Saint-Nicolas-de-Véroce permettent d’alterner alpages, hameaux et vues ouvertes.",
        ],
      },
      {
        title: "Retrouver le village",
        paragraphs: [
          "Après la montagne, le centre de Saint-Gervais rassemble commerces, terrasses et adresses gourmandes. Notre guide d’arrivée adapte ces recommandations à la saison et à l’emplacement de chaque logement.",
        ],
      },
    ],
  },
  {
    slug: "conciergerie-attentive-essentiels",
    category: "Conciergerie",
    title: "Les essentiels d’une conciergerie attentive",
    excerpt:
      "Ce qui fait réellement la différence avant, pendant et après chaque séjour.",
    image:
      "https://cdn.sanity.io/images/4s1z0bj2/production/6011587dfd16800c5d723c9cedf9f5c423f9e667-4000x2667.webp",
    readingTime: "5 min",
    publishedAt: "4 juillet 2026",
    introduction:
      "Une conciergerie ne se résume pas à la remise de clés. Elle protège la qualité du logement, coordonne les interventions et garantit aux voyageurs un interlocuteur identifiable.",
    highlights: [
      "Un interlocuteur local clairement identifié",
      "Un suivi du logement entre chaque séjour",
      "Des outils qui libèrent du temps humain",
    ],
    sections: [
      {
        title: "Une présence avant tout locale",
        paragraphs: [
          "La connaissance du terrain permet de réagir rapidement et de recommander les bons prestataires. Elle crée aussi une relation plus directe avec les propriétaires comme avec les voyageurs.",
        ],
      },
      {
        title: "Des outils qui soutiennent l’humain",
        paragraphs: [
          "L’automatisation est utile lorsqu’elle libère du temps. Le guide MyStay répond aux demandes répétitives afin que notre équipe reste disponible pour les situations qui nécessitent réellement une attention humaine.",
        ],
      },
    ],
  },
  {
    slug: "moins-questions-guide-arrivee",
    category: "Guide MyStay",
    title: "Moins de questions grâce au guide d’arrivée",
    excerpt:
      "Comment centraliser les accès, les équipements et les recommandations sans imposer une application.",
    image:
      "https://cdn.sanity.io/images/4s1z0bj2/production/25dc6be90c71b3db4bca0f066dca76e07a0db359-4000x2666.webp",
    readingTime: "4 min",
    publishedAt: "27 juin 2026",
    introduction:
      "Les mêmes questions reviennent dans presque tous les séjours. Plutôt que de multiplier les messages, un guide clair permet au voyageur de retrouver immédiatement la bonne réponse.",
    highlights: [
      "Une information hiérarchisée selon le séjour",
      "Aucun compte ni téléchargement nécessaire",
      "Moins de messages, sans déshumaniser l’accueil",
    ],
    sections: [
      {
        title: "Une information disponible au bon moment",
        paragraphs: [
          "Le code Wi-Fi n’a pas besoin d’occuper le premier message d’arrivée, alors que l’adresse et le stationnement sont essentiels. Une bonne hiérarchie évite la surcharge d’informations.",
        ],
      },
      {
        title: "Aucun téléchargement nécessaire",
        paragraphs: [
          "Le guide s’ouvre depuis un lien privé ou un QR code. Il reste accessible sur mobile pendant tout le séjour, sans compte à créer ni application à installer.",
        ],
      },
    ],
  },
];

export const blogCategories = [
  "Toutes",
  ...Array.from(new Set(blogPosts.map((post) => post.category))),
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
