import type { Metadata } from "next";
import Link from "next/link";
import {
  Bath,
  BedDouble,
  CarFront,
  ChefHat,
  Coffee,
  CookingPot,
  Flame,
  Footprints,
  House,
  MapPin,
  Mountain,
  MountainSnow,
  PersonStanding,
  Plane,
  PlugZap,
  Projector,
  Shirt,
  Snowflake,
  Sparkles,
  Sun,
  TicketCheck,
  Toilet,
  TreePine,
  Tv,
  WashingMachine,
  WavesLadder,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { Footer, Header, SiteFrame } from "../../ui";
import { getProperty, properties } from "../../properties";

const featureIcons: Array<[string[], LucideIcon]> = [
  [["chambre", "lit double", "lit simple", "lits jumeaux"], BedDouble],
  [["salle de bain"], Bath],
  [["toilette"], Toilet],
  [["wi-fi"], Wifi],
  [["borne de recharge"], PlugZap],
  [["parking", "transfert"], CarFront],
  [["barbecue", "cheminée"], Flame],
  [["piscine"], WavesLadder],
  [["vidéoprojecteur"], Projector],
  [["cuisine"], CookingPot],
  [["linge", "serviette"], Shirt],
  [["chef"], ChefHat],
  [["yoga"], PersonStanding],
  [["petit déjeuner"], Coffee],
  [["cours de ski", "pistes", "local à skis"], MountainSnow],
  [["forfait"], TicketCheck],
  [["terrasse", "balcon"], Sun],
  [["vue montagne", "montagne"], Mountain],
  [["lac"], WavesLadder],
  [["lave-linge"], WashingMachine],
  [["télévision"], Tv],
  [["centre-village", "proximité"], MapPin],
  [["extérieur", "jardin"], TreePine],
  [["à pied"], Footprints],
  [["climatisation"], Snowflake],
  [["maison", "chalet"], House],
  [["avion"], Plane],
];

function FeatureItem({ item }: { item: string }) {
  const normalizedItem = item.toLocaleLowerCase("fr");
  const Icon =
    featureIcons.find(([terms]) =>
      terms.some((term) => normalizedItem.includes(term)),
    )?.[1] ?? Sparkles;

  return (
    <li>
      <Icon aria-hidden="true" strokeWidth={1.7} />
      <span>{item}</span>
    </li>
  );
}

export function generateStaticParams() {
  return properties.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = getProperty(slug);

  return {
    title: property
      ? `${property.name} — Location à ${property.place} | MyStay`
      : "Logement | MyStay",
    description: property?.description,
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = getProperty(slug);

  if (!property) {
    return (
      <SiteFrame>
        <Header />
        <main className="property-not-found shell">
          <span className="eyebrow">Logement introuvable</span>
          <h1>Cette adresse n’est pas encore disponible.</h1>
          <Link className="button primary" href="/logements">
            Voir tous les logements <span>→</span>
          </Link>
        </main>
        <Footer />
      </SiteFrame>
    );
  }

  const essentials = [
    { label: "Surface", value: property.stats.surface },
    { label: "Voyageurs", value: property.stats.travelers },
    { label: "Chambres", value: property.stats.bedrooms },
    { label: "Salles de bain", value: property.stats.bathrooms },
    {
      label: "Arrivée",
      value:
        property.facts.find((fact) => fact.label === "Arrivée")?.value ??
        "À partir de 16 h",
    },
    {
      label: "Départ",
      value:
        property.facts.find((fact) => fact.label === "Départ")?.value ??
        "Avant 10 h",
    },
  ];

  return (
    <SiteFrame>
      <Header />
      <main className="property-detail">
        <section className="property-detail-heading shell">
          <Link className="property-back-link" href="/logements">
            ← Tous les logements
          </Link>
          <div className="property-detail-title">
            <div>
              <span className="eyebrow">{property.place}</span>
              <h1>{property.name}</h1>
              <p>{property.eyebrow}</p>
            </div>
            <a
              className="button primary property-airbnb-top"
              href={property.airbnbUrl}
              rel="noreferrer"
              target="_blank"
            >
              Voir sur Airbnb
            </a>
          </div>
        </section>

        <section
          aria-label={`Photos de ${property.name}`}
          className="property-gallery shell"
        >
          <div
            className="property-gallery-main"
            style={{ backgroundImage: `url("${property.gallery[0]}")` }}
          />
          <div
            className="property-gallery-secondary"
            style={{ backgroundImage: `url("${property.gallery[1]}")` }}
          />
          <div
            className="property-gallery-secondary property-gallery-detail"
            style={{ backgroundImage: `url("${property.gallery[2]}")` }}
          />
        </section>

        <section className="property-detail-content shell">
          <div className="property-story">
            <span className="eyebrow">Le logement</span>
            <h2>{property.description}</h2>
            {property.longDescription.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <aside className="property-stay-card">
            <span className="eyebrow">Votre séjour</span>
            <h3>{property.name}</h3>
            <p>{property.minimumStay ?? "Séjour selon disponibilités"}</p>
            {property.startingPrice && (
              <strong>{property.startingPrice}</strong>
            )}
            <a
              className="button primary"
              href={property.airbnbUrl}
              rel="noreferrer"
              target="_blank"
            >
              Voir les disponibilités
            </a>
          </aside>
        </section>

        <section className="property-information">
          <div className="shell">
            <div className="property-information-heading">
              <span className="eyebrow">En détail</span>
              <h2>Les essentiels, en un coup d’œil.</h2>
            </div>
            <dl
              aria-label={`Caractéristiques principales de ${property.name}`}
              className="property-essentials"
            >
              {essentials.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="shell property-comfort">
          <article>
            <span className="property-section-number">01</span>
            <span className="eyebrow">Couchages</span>
            <h2>Des espaces pensés pour bien se retrouver.</h2>
            <ul>
              {property.sleeping.map((item) => (
                <FeatureItem item={item} key={item} />
              ))}
            </ul>
          </article>
          <article>
            <span className="property-section-number">02</span>
            <span className="eyebrow">Équipements</span>
            <h2>Le confort essentiel, sur place.</h2>
            <ul className="property-amenities">
              {property.amenities.map((item) => (
                <FeatureItem item={item} key={item} />
              ))}
            </ul>
          </article>
          {property.services && (
            <article>
              <span className="property-section-number">03</span>
              <span className="eyebrow">Services sur demande</span>
              <h2>Un séjour qui s’adapte à vos envies.</h2>
              <ul className="property-amenities">
                {property.services.map((item) => (
                  <FeatureItem item={item} key={item} />
                ))}
              </ul>
            </article>
          )}
        </section>

        {property.surroundings && property.distances && (
          <section className="property-surroundings">
            <div className="shell property-surroundings-grid">
              <div>
                <span className="eyebrow">Les alentours</span>
                <h2>La montagne, le village et toutes les commodités.</h2>
                <p>{property.surroundings}</p>
              </div>
              <dl>
                {property.distances.map((distance) => (
                  <div key={distance.label}>
                    <dt>{distance.label}</dt>
                    <dd>{distance.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {property.rules && (
          <section className="shell property-rules">
            <div>
              <span className="eyebrow">Bon à savoir</span>
              <h2>Quelques repères pour préparer votre séjour.</h2>
            </div>
            <ul>
              {property.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="property-booking shell">
          <div>
            <span className="eyebrow">Réserver ce logement</span>
            <h2>Envie de séjourner au {property.name} ?</h2>
            <p>
              Consultez les disponibilités, les tarifs et les conditions de
              réservation directement sur Airbnb.
            </p>
          </div>
          <a
            className="button white property-booking-button"
            href={property.airbnbUrl}
            rel="noreferrer"
            target="_blank"
          >
            Consulter l’annonce Airbnb
          </a>
        </section>
      </main>
      <Footer />
    </SiteFrame>
  );
}
