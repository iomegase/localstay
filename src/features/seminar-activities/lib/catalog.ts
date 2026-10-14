import type { SeminarActivityCategory } from '../types'

export type CatalogActivity = {
  title: string
  category: SeminarActivityCategory
  description: string
  season_label: string
  level_label: string
}

/** Spec 097 BR-14 : les 42 activités fournies par le Product Owner le 2026-10-14. */
export const SEMINAR_ACTIVITY_CATALOG: readonly CatalogActivity[] = [
  // Catégorie 1 — Team building & cohésion
  { category: 'TEAM_BUILDING', title: 'Olympiades en montagne', description: 'Défis d’adresse, épreuves collectives et challenges ludiques : une expérience conviviale pour renforcer la cohésion et l’esprit d’équipe.', season_label: 'Toute l’année', level_label: 'Tous niveaux' },
  { category: 'TEAM_BUILDING', title: 'Challenge d’orientation', description: 'Carte et boussole en main, partez en équipe à la recherche de balises et résolvez des énigmes au cœur des paysages alpins.', season_label: 'Printemps, été, automne', level_label: 'Accessible' },
  { category: 'TEAM_BUILDING', title: 'Biathlon', description: 'Associez précision, concentration et esprit d’équipe lors d’une initiation au biathlon, avec une formule adaptée au niveau de chacun.', season_label: 'Toute l’année selon la formule', level_label: 'Tous niveaux' },
  { category: 'TEAM_BUILDING', title: 'Construction d’igloos', description: 'Imaginez et construisez votre igloo en équipe. Un défi original où communication, organisation et coopération font toute la différence.', season_label: 'Hiver', level_label: 'Accessible' },
  { category: 'TEAM_BUILDING', title: 'Challenge survie', description: 'Face à une série de défis inspirés de la survie en montagne, apprenez à unir vos compétences pour atteindre un objectif commun.', season_label: 'Toute l’année', level_label: 'Modéré' },
  { category: 'TEAM_BUILDING', title: 'Rallye découverte', description: 'Explorez les villages et paysages du Mont-Blanc à travers un parcours mêlant énigmes, observation et défis collectifs.', season_label: 'Toute l’année', level_label: 'Accessible' },
  { category: 'TEAM_BUILDING', title: 'Murder Party au chalet', description: 'Plongez dans une enquête immersive où chaque participant détient une partie du mystère. Une expérience collective mêlant réflexion et déduction.', season_label: 'Toute l’année', level_label: 'Tous niveaux' },
  { category: 'TEAM_BUILDING', title: 'Leadership en montagne', description: 'Explorez les notions de confiance, de décision et de responsabilité à travers une expérience collective inspirée des métiers de la montagne.', season_label: 'Toute l’année', level_label: 'Adaptable' },
  // Catégorie 2 — Activités hiver
  { category: 'WINTER', title: 'Randonnée en raquettes', description: 'Découvrez la montagne autrement lors d’une randonnée accompagnée à travers les forêts enneigées et les paysages du massif du Mont-Blanc.', season_label: 'Hiver', level_label: 'Accessible à sportif' },
  { category: 'WINTER', title: 'Ski alpin', description: 'Partagez une journée de glisse sur les domaines skiables du Mont-Blanc, accompagnés de moniteurs pour une expérience adaptée à chaque niveau.', season_label: 'Hiver', level_label: 'Tous niveaux' },
  { category: 'WINTER', title: 'Initiation au ski de randonnée', description: 'Quittez les pistes pour découvrir les espaces naturels enneigés. Une initiation encadrée à la progression en montagne hivernale.', season_label: 'Hiver', level_label: 'Sportif' },
  { category: 'WINTER', title: 'Ski nordique', description: 'Découvrez les plaisirs du ski de fond dans un environnement préservé. Une activité qui associe endurance douce, découverte et convivialité.', season_label: 'Hiver', level_label: 'Accessible à sportif' },
  { category: 'WINTER', title: 'Chiens de traîneau', description: 'Découvrez l’univers des mushers et vivez une expérience nordique au contact des chiens, dans les paysages enneigés des Alpes.', season_label: 'Hiver', level_label: 'Accessible' },
  { category: 'WINTER', title: 'Cascade de glace', description: 'Initiez-vous à l’escalade sur glace accompagné de guides professionnels. Une aventure originale pour les amateurs de nouvelles expériences.', season_label: 'Hiver', level_label: 'Sportif' },
  { category: 'WINTER', title: 'Eisstock', description: 'Découvrez une discipline conviviale proche de la pétanque, pratiquée sur la glace. Adresse, stratégie et bonne humeur au programme.', season_label: 'Toute l’année selon installation', level_label: 'Tous niveaux' },
  { category: 'WINTER', title: 'Apéritif sous les étoiles', description: 'Après une courte randonnée en raquettes, partagez un apéritif dans un igloo ou un abri insolite au cœur de la montagne enneigée.', season_label: 'Hiver', level_label: 'Accessible' },
  // Catégorie 3 — Aventures & activités été
  { category: 'SUMMER', title: 'Randonnée accompagnée', description: 'Prenez de la hauteur et découvrez les plus beaux panoramas du Mont-Blanc lors d’une randonnée adaptée au rythme de votre groupe.', season_label: 'Printemps, été, automne', level_label: 'Tous niveaux' },
  { category: 'SUMMER', title: 'VTT électrique', description: 'Explorez les sentiers et alpages du Pays du Mont-Blanc en VTT à assistance électrique, accompagné d’un guide professionnel.', season_label: 'Printemps, été, automne', level_label: 'Accessible à sportif' },
  { category: 'SUMMER', title: 'Rafting', description: 'Embarquez pour une descente en eaux vives et partagez une expérience collective où coordination et esprit d’équipe sont essentiels.', season_label: 'Printemps, été', level_label: 'Modéré à sportif' },
  { category: 'SUMMER', title: 'Canyoning', description: 'Progressez entre cascades, vasques naturelles et passages rocheux lors d’une aventure aquatique encadrée par des professionnels.', season_label: 'Été', level_label: 'Sportif' },
  { category: 'SUMMER', title: 'Via ferrata', description: 'Découvrez les parois de montagne grâce à des parcours équipés. Une expérience aérienne mêlant découverte, engagement et dépassement de soi.', season_label: 'Printemps, été, automne', level_label: 'Modéré à sportif' },
  { category: 'SUMMER', title: 'Initiation à l’escalade', description: 'Découvrez les sensations de l’escalade sur rocher naturel, accompagné de guides qui adaptent les parcours à votre expérience.', season_label: 'Printemps, été, automne', level_label: 'Tous niveaux selon site' },
  { category: 'SUMMER', title: 'Parcours aventure', description: 'Tyroliennes, ponts suspendus et ateliers en hauteur : partagez une expérience ludique au milieu des arbres.', season_label: 'Printemps, été, automne', level_label: 'Accessible à sportif' },
  { category: 'SUMMER', title: 'Baptême en parapente', description: 'Prenez de la hauteur et découvrez les paysages du Mont-Blanc depuis le ciel, accompagné d’un pilote professionnel.', season_label: 'Toute l’année selon conditions', level_label: 'Accessible selon conditions' },
  // Catégorie 4 — Bien-être & déconnexion
  { category: 'WELLBEING', title: 'Yoga au chalet', description: 'Offrez à votre équipe une parenthèse de détente avec une séance de yoga privative, adaptée à tous les niveaux et organisée dans votre hébergement.', season_label: 'Toute l’année', level_label: 'Tous niveaux' },
  { category: 'WELLBEING', title: 'Bain de forêt', description: 'Reconnectez-vous à la nature lors d’une marche sensorielle accompagnée. Une expérience douce pour ralentir et retrouver de la sérénité.', season_label: 'Printemps, été, automne', level_label: 'Accessible' },
  { category: 'WELLBEING', title: 'Expérience thermale', description: 'Profitez des bienfaits d’une parenthèse thermale à Saint-Gervais pour relâcher les tensions et retrouver un équilibre entre corps et esprit.', season_label: 'Selon ouverture', level_label: 'Tous niveaux' },
  { category: 'WELLBEING', title: 'Massages & soins au chalet', description: 'Transformez votre hébergement en espace de détente grâce à des massages et soins individuels réalisés par des professionnels.', season_label: 'Toute l’année', level_label: 'Tous niveaux' },
  { category: 'WELLBEING', title: 'Méditation & respiration', description: 'Accordez-vous un moment de calme à travers une séance guidée de respiration, de relaxation ou de méditation.', season_label: 'Toute l’année', level_label: 'Tous niveaux' },
  // Catégorie 5 — Gastronomie & art de vivre
  { category: 'GASTRONOMY', title: 'Chef privé au chalet', description: 'Partagez une expérience gastronomique exclusive avec un chef à domicile, autour d’un menu imaginé pour votre groupe.', season_label: 'Toute l’année', level_label: 'Tous publics' },
  { category: 'GASTRONOMY', title: 'Atelier de cuisine', description: 'Réunissez vos collaborateurs autour d’un atelier culinaire convivial. Préparez ensemble un menu inspiré des produits et traditions alpines.', season_label: 'Toute l’année', level_label: 'Tous publics' },
  { category: 'GASTRONOMY', title: 'Découverte des fromages alpins', description: 'Partez à la rencontre des producteurs et découvrez les savoir-faire fromagers de Haute-Savoie, entre traditions locales et dégustation.', season_label: 'Toute l’année selon producteur', level_label: 'Tous publics' },
  { category: 'GASTRONOMY', title: 'Visite d’une distillerie artisanale', description: 'Découvrez les secrets de la distillation au cœur des montagnes et rencontrez des artisans passionnés par leur métier.', season_label: 'Toute l’année sur réservation', level_label: 'Tous publics pour la visite' },
  { category: 'GASTRONOMY', title: 'Atelier de création de gin', description: 'Découvrez les différentes étapes de la distillation et composez votre propre création à partir d’une sélection de plantes aromatiques.', season_label: 'Toute l’année selon calendrier', level_label: 'Adultes' },
  { category: 'GASTRONOMY', title: 'Dégustation vins & fromages', description: 'Explorez les accords entre vins et fromages régionaux lors d’une dégustation privée, animée par un professionnel.', season_label: 'Toute l’année', level_label: 'Adultes' },
  // Catégorie 6 — Découvertes & expériences d'exception
  { category: 'EXCEPTIONAL', title: 'L’Aiguille du Midi', description: 'Prenez de la hauteur jusqu’à 3 842 mètres et découvrez l’un des panoramas les plus spectaculaires du massif du Mont-Blanc.', season_label: 'Selon ouverture du téléphérique', level_label: 'Accessible sous conditions' },
  { category: 'EXCEPTIONAL', title: 'Le Montenvers & la Mer de Glace', description: 'Embarquez à bord du célèbre train du Montenvers et découvrez un site emblématique de l’histoire alpine face aux glaciers.', season_label: 'Selon ouverture', level_label: 'Accessible' },
  { category: 'EXCEPTIONAL', title: 'Randonnée glaciaire', description: 'Accompagnés de guides de haute montagne, découvrez l’univers des glaciers et les sensations d’une progression encadrée sur la glace.', season_label: 'Selon conditions', level_label: 'Sportif' },
  { category: 'EXCEPTIONAL', title: 'Atelier photographie de montagne', description: 'Apprenez à capturer la lumière et les paysages alpins lors d’une sortie photographique accompagnée par un professionnel.', season_label: 'Toute l’année', level_label: 'Tous niveaux' },
  { category: 'EXCEPTIONAL', title: 'Sur les traces des alpinistes', description: 'Plongez dans l’histoire des premières ascensions du Mont-Blanc à travers une découverte du patrimoine et des grandes figures de l’alpinisme.', season_label: 'Toute l’année selon ouverture', level_label: 'Tous publics' },
  { category: 'EXCEPTIONAL', title: 'Observation du ciel étoilé', description: 'Découvrez les constellations et les secrets du ciel alpin lors d’une soirée d’observation accompagnée d’un intervenant spécialisé.', season_label: 'Toute l’année selon conditions', level_label: 'Tous publics' },
  { category: 'EXCEPTIONAL', title: 'Rencontre avec un guide de haute montagne', description: 'Échangez avec un professionnel de l’alpinisme autour de ses expériences, de la gestion du risque et de la prise de décision en milieu exigeant.', season_label: 'Toute l’année', level_label: 'Tous publics' },
]
