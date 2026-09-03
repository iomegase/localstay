// Instantané éditorial statique dérivé des POI publics (spec 031, BR-25).
// Photos, notes, horaires et descriptions sont issus des POI en base ; certaines
// notes de l'hôte ont été curées pour la démonstration (hôte fictif, BR-24).
import type { DemoPoiHours } from './types'

export type DemoPoiContent = {
  photos?: string[]
  rating?: number
  reviewCount?: number
  hours?: DemoPoiHours
  description?: string
  website?: string
  phone?: string
  ownerNote?: string
}

export const DEMO_POI_CONTENT: Record<string, DemoPoiContent> = {
  "rond-de-carotte": {
    "photos": [
      "https://cftqqyqfhlvobtsatxdq.supabase.co/storage/v1/object/public/guide-photos/pois/1782132327133.avif",
      "https://static.wixstatic.com/media/90a441_f2231b6f47ac4f62bf3b744c42cee73b~mv2.jpg/v1/fill/w_283,h_100,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/90a441_f2231b6f47ac4f62bf3b744c42cee73b~mv2.jpg"
    ],
    "rating": 4.8,
    "reviewCount": 367,
    "hours": {
      "0": {
        "open": "09:00",
        "close": "16:00"
      },
      "1": {
        "open": "09:00",
        "close": "16:00"
      },
      "4": {
        "open": "09:00",
        "close": "16:00"
      },
      "5": {
        "open": "09:00",
        "close": "22:30"
      },
      "6": {
        "open": "09:00",
        "close": "22:30"
      }
    },
    "description": "Le Rond de Carotte vous invite à Saint-Gervais-les-Bains pour profiter d'une ambiance conviviale et chaleureuse. Un lieu idéal où chaque moment se savoure différemment, promettant de belles découvertes culinaires.",
    "website": "https://www.ronddecarotte.com/",
    "phone": "04 50 47 76 39",
    "ownerNote": "Une belle adresse du coin, à la fois simple, conviviale et soignée, parfaite pour partager un bon repas dans une ambiance agréable."
  },
  "bistrotserac": {
    "photos": [
      "https://www.3serac.fr/media/cache/jadro_resize/rc/FjUHU7lg1755510540/jadroRoot/medias/68077ec88354f/atelier-boris-molinier-lou-broche-2278.jpg",
      "https://www.3serac.fr/media/cache/jadro_resize/rc/erLg1pxt1755510540/jadroRoot/medias/68077deacbf72/atelier-boris-molinier-lou-broche-2475.jpg",
      "https://www.3serac.fr/media/cache/jadro_resize/rc/TwseeRLU1755510539/jadroRoot/medias/68077ddf79de6/atelier-boris-molinier-lou-broche-8675.jpg"
    ],
    "rating": 4.4,
    "reviewCount": 555,
    "hours": {
      "2": {
        "open": "12:15",
        "close": "21:30"
      },
      "3": {
        "open": "12:15",
        "close": "21:30"
      },
      "4": {
        "open": "12:15",
        "close": "21:30"
      },
      "5": {
        "open": "12:15",
        "close": "21:30"
      },
      "6": {
        "open": "12:15",
        "close": "21:30"
      }
    },
    "description": "Situé au cœur de Saint-Gervais-les-Bains, le Bistrotsérac est le rendez-vous incontournable des amateurs de viande d'exception. Grâce à une cuisine ouverte sur les fourneaux, vous pourrez apprécier le savoir-faire du chef et sa cuisson signature à la braise. Une adresse chaleureuse et conviviale à découvrir au pied du massif du Mont-Blanc.",
    "website": "http://www.3serac.fr/",
    "phone": "04 50 98 43 35"
  },
  "le-relais-des-communailles": {
    "photos": [
      "https://lerelaisdescommunailles.com/wp-content/uploads/2024/02/7H2A7789-scaled.jpg",
      "https://lerelaisdescommunailles.com/wp-content/uploads/2023/12/7H2A7507-2-scaled.jpg",
      "https://lerelaisdescommunailles.com/wp-content/uploads/2025/08/7H2A9825-scaled.jpg",
      "https://lerelaisdescommunailles.com/wp-content/uploads/2025/01/7H2A9496.jpg",
      "https://lerelaisdescommunailles.com/wp-content/uploads/2025/08/7H2A9831-scaled.jpg",
      "https://lerelaisdescommunailles.com/wp-content/uploads/2024/04/DJI_0371-2-scaled.jpg"
    ],
    "rating": 4.9,
    "reviewCount": 352,
    "hours": {
      "0": {
        "open": "10:00",
        "close": "14:00"
      },
      "5": {
        "open": "19:00",
        "close": "23:00"
      },
      "6": {
        "open": "10:00",
        "close": "15:00"
      }
    },
    "description": "Le Relais des Communailles est un lieu de vie iconique à Saint-Gervais Mont-Blanc, idéal pour les épicuriens amoureux de la montagne. Venez partager des moments de convivialité dans une ambiance chic et authentique, face à un panorama unique sur le Mont-Blanc.",
    "website": "https://lerelaisdescommunailles.com/",
    "phone": "04 50 21 67 70",
    "ownerNote": "Une table d’exception face au Mont-Blanc : parfaite pour un déjeuner au soleil comme pour un dîner plus intime au coucher du soleil."
  },
  "boulangerie-petit-biscuit-la-patinoire": {
    "photos": [
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/246/232/41609462.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/245/232/41609461.jpg",
      "https://api.cloudly.space/resize/crop/1200/627/60/aHR0cHM6Ly9zdGF0aWMuYXBpZGFlLXRvdXJpc21lLmNvbS9maWxlc3RvcmUvb2JqZXRzLXRvdXJpc3RpcXVlcy9pbWFnZXMvMjQ3LzIzMi80MTYwOTQ2My5qcGc=/image.jpg"
    ],
    "description": "Située à Saint-Gervais-les-Bains, près de la patinoire, la Boulangerie Petit Biscuit propose une variété de pains frais et viennoiseries artisanales. Idéale pour un petit-déjeuner gourmand ou une pause sucrée, elle offre des délices pour toutes vos envies.",
    "website": "https://www.saintgervais.com/jai-envie/commerces-services/boulangerie-petit-biscuit-la-patinoire-saint-gervais-les-bains-fr-5172484/"
  },
  "carrefour-express": {
    "rating": 4.1,
    "reviewCount": 227,
    "hours": {
      "0": {
        "open": "08:00",
        "close": "19:00"
      },
      "1": {
        "open": "08:00",
        "close": "20:00"
      },
      "2": {
        "open": "08:00",
        "close": "20:00"
      },
      "3": {
        "open": "08:00",
        "close": "20:00"
      },
      "4": {
        "open": "08:00",
        "close": "20:00"
      },
      "5": {
        "open": "08:00",
        "close": "20:00"
      },
      "6": {
        "open": "08:00",
        "close": "20:00"
      }
    },
    "description": "Situé en plein cœur de Saint-Gervais-les-Bains, ce commerce de proximité est idéal pour effectuer vos courses quotidiennes en toute simplicité. Vous y trouverez un large choix de produits essentiels, de fruits et légumes frais ainsi que des articles de dépannage. C'est une adresse pratique et chaleureuse pour faciliter votre séjour à la montagne.",
    "website": "https://www.carrefour.fr/magasin/express-saint-gervais",
    "phone": "04 50 47 94 74"
  },
  "maison-forte-de-hautetour": {
    "photos": [
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/60/198/37209660.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/2/90/30956034.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/63/199/37209919.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/253/193/37208573.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/134/48/34091142.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/116/63/29441908.jpg"
    ],
    "rating": 4.4,
    "reviewCount": 67,
    "hours": {
      "0": {
        "open": "14:00",
        "close": "18:00"
      },
      "2": {
        "open": "14:00",
        "close": "18:00"
      },
      "3": {
        "open": "14:00",
        "close": "18:00"
      },
      "4": {
        "open": "14:00",
        "close": "18:00"
      },
      "6": {
        "open": "14:00",
        "close": "18:00"
      }
    },
    "description": "Ancienne bâtisse du 13e siècle, la Maison forte de Hautetour est un lieu culturel dynamique à Saint-Gervais-les-Bains. Elle propose une exposition permanente dédiée à l'alpinisme et à l'histoire des guides, avec archives, photographies et œuvres contemporaines. Ce centre accueille aussi des expositions temporaires, des résidences artistiques et des activités pour les familles.",
    "website": "https://www.saintgervais.com/offres/maison-forte-de-hautetour-saint-gervais-les-bains-fr-4247482/",
    "phone": "04 50 47 78 95"
  },
  "la-cure": {
    "photos": [
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/31/195/37208863.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/225/56/15874273.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/226/56/15874274.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/228/56/15874276.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/229/56/15874277.jpg"
    ],
    "rating": 4.8,
    "reviewCount": 6,
    "hours": {
      "2": {
        "open": "10:00",
        "close": "18:00"
      },
      "3": {
        "open": "10:00",
        "close": "18:00"
      },
      "4": {
        "open": "10:00",
        "close": "18:00"
      },
      "5": {
        "open": "10:00",
        "close": "18:00"
      },
      "6": {
        "open": "14:00",
        "close": "18:00"
      }
    },
    "description": "Au cœur du village, La Cure est le nouveau pôle culturel de Saint-Gervais. Explorez le patrimoine de la commune à travers des expositions, une bibliothèque de montagne et une riche programmation. Ce lieu dynamique propose également des ateliers et conférences pour tous les publics.",
    "website": "https://www.saintgervais.com/offres/la-cure-saint-gervais-les-bains-fr-4247479/",
    "phone": "04 50 47 78 95"
  },
  "tramway-du-mont-blanc": {
    "photos": [
      "https://www.tramwaydumontblanc.fr/app/uploads/2026/04/Gare_de_Saint-Gervais_du_Tramway_du_Mont-Blanc-Hugo_GUILLEREZ-13658-1200px-1.jpg",
      "https://www.tramwaydumontblanc.fr/app/uploads/2026/04/Tramway_du_Mont-Blanc_au_col_de_Voza-Fabian_BODET-15318-1200px-1.jpg",
      "https://www.tramwaydumontblanc.fr/app/uploads/2026/04/Tramway_du_Mont-Blanc_en_direction_de_Bellevue-Fabian_BODET-15304-1200px.jpg",
      "https://www.tramwaydumontblanc.fr/app/uploads/2026/04/Tramway_du_Mont-Blanc_au_Mont_Lachat-Fabian_BODET-15323-1200px.jpg",
      "https://www.tramwaydumontblanc.fr/app/uploads/2026/05/Plan-de-travail-2@2x.webp",
      "https://www.tramwaydumontblanc.fr/app/uploads/2026/04/Tramway_du_Mont-Blanc_au_col_de_Voza-Fabian_BODET-15317-1200px.jpg"
    ],
    "rating": 4,
    "reviewCount": 381,
    "description": "Le Tramway du Mont-Blanc vous invite à une aventure unique, du Fayet au Nid d'Aigle, en gagnant 1800m de dénivelé à travers un massif alpin sauvage. Idéal pour les alpinistes en route vers le Mont-Blanc ou pour une immersion spectaculaire en haute montagne avec votre famille.",
    "website": "https://www.montblancnaturalresort.com/fr/tramway-montblanc",
    "ownerNote": "Rejoignez le Nid d’Aigle en tramway et admirez une vue panoramique exceptionnelle. En hiver, optez pour un forfait Saint-Gervais / Les Houches et profitez d’un autre domaine skiable pour varier les plaisirs."
  },
  "telecabine-le-bettex": {
    "photos": [
      "https://woody.cloudly.space/app/uploads/saint-gervais/2023/07/thumbs/DSC01791-1920x960.jpg",
      "https://www.saintgervais.com/app/uploads/saint-gervais/2023/07/thumbs/DSC01791-1920x960.jpg",
      "https://woody.cloudly.space/app/uploads/saint-gervais/2025/11/thumbs/2024_10_29_MANONGUENOT_TSGMB_DSC01750-640x640.webp",
      "https://woody.cloudly.space/app/uploads/saint-gervais/2024/03/thumbs/Boris-Molinier-9632-640x320-crop-1711017505.webp",
      "https://woody.cloudly.space/app/uploads/saint-gervais/2025/04/thumbs/TMBFabian_BODET-34-640x640.webp",
      "https://woody.cloudly.space/app/uploads/saint-gervais/2025/11/thumbs/Boris-Molinier-34-640x320.webp"
    ],
    "rating": 4.5,
    "reviewCount": 323,
    "hours": {
      "0": {
        "open": "09:00",
        "close": "18:00"
      },
      "1": {
        "open": "09:00",
        "close": "18:00"
      },
      "2": {
        "open": "09:00",
        "close": "18:00"
      },
      "3": {
        "open": "09:00",
        "close": "18:00"
      },
      "4": {
        "open": "09:00",
        "close": "18:00"
      },
      "5": {
        "open": "09:00",
        "close": "18:00"
      },
      "6": {
        "open": "09:00",
        "close": "18:00"
      }
    },
    "description": "Empruntez le Télécabine Le Bettex pour une ascension rapide depuis Saint-Gervais-les-Bains vers les sommets. Profitez d'une vue époustouflante sur le Mont Blanc et accédez aisément aux pistes ou aux sentiers de randonnée. C'est un point de départ privilégié pour vos aventures en montagne.",
    "website": "https://www.saintgervais.com/equipement/telecabine-saint-gervais-le-bettex-saint-gervais-les-bains#:~:text=Le%20t%C3%A9l%C3%A9cabine%20de%20Saint-Gervais,%C3%A9poustouflant%20sur%20le%20Mont%20Blanc."
  },
  "thermes-de-saint-gervais": {
    "photos": [
      "https://www.thermes-saint-gervais.com/include/images/Menu_Sejours_Sante.jpg",
      "https://www.thermes-saint-gervais.com/include/images/Menu_cures.jpg",
      "https://www.thermes-saint-gervais.com/include/images/Menu_Thermes.jpg"
    ],
    "rating": 3.9,
    "reviewCount": 2316,
    "hours": {
      "0": {
        "open": "10:00",
        "close": "20:00"
      },
      "1": {
        "open": "09:00",
        "close": "21:00"
      },
      "2": {
        "open": "09:00",
        "close": "21:00"
      },
      "3": {
        "open": "09:00",
        "close": "21:00"
      },
      "4": {
        "open": "09:00",
        "close": "21:00"
      },
      "5": {
        "open": "09:00",
        "close": "21:00"
      },
      "6": {
        "open": "09:00",
        "close": "21:00"
      }
    },
    "description": "Les Thermes de Saint-Gervais Mont Blanc proposent des cures thermales et un spa, utilisant une eau unique reconnue pour ses vertus thérapeutiques depuis 1807. Riche en minéraux, cette eau est réparatrice, apaisante et cicatrisante, offrant des bienfaits pour la dermatologie, les voies respiratoires et le bien-être général.",
    "website": "https://www.thermes-saint-gervais.com/"
  },
  "alpage-de-porcherey": {
    "photos": [
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/181/221/31382965.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/119/221/31382903.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/120/221/31382904.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/180/221/31382964.jpg",
      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/188/221/31382972.jpg"
    ],
    "description": "Cette randonnée à l'Alpage de Porcherey, situé près de Saint-Gervais-les-Bains, propose un cadre alpin paisible avec des vues imprenables sur le massif du Mont-Blanc, incluant l'Aiguille de Bionnassay et les Dômes de Miage. Le sentier traverse des forêts ombragées et des clairières bucoliques, offrant des panoramas grandioses notamment depuis les flancs du Mont Joly. À l'arrivée à l'alpage, culminant à 1698m d'altitude, il est possible de découvrir et déguster des produits régionaux.",
    "website": "https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/les-chalets-de-porcherey-au-depart-du-plateau-de-la-croix-saint-gervais-les-bains-fr-5704123/",
    "ownerNote": "Une très belle randonnée familiale, facile et accessible à tous. Si vous manquez de temps, garez-vous directement au plateau de la Croix, à Saint-Nicolas-de-Véroce : vous gagnerez ainsi environ deux heures sur votre itinéraire."
  }
}
