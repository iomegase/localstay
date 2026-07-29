import Link from "next/link";
import {
  BedDouble,
  CarFront,
  ClipboardCheck,
  Flower2,
  Heart,
  MessagesSquare,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { GuideModal } from "./guide-modal";
import { Footer, Header, PropertyCard, SiteFrame } from "./ui";

const properties = [
  {
    place: "Saint-Gervais-les-Bains",
    name: "Le Refuge des Cimes",
    description: "Un chalet chaleureux avec terrasse, cheminée et vue ouverte sur les sommets.",
    image: "/hero-chalet.png",
    href: "/logements/le-refuge-des-cimes",
    stats: { surface: "180 m²", travelers: "11", bedrooms: "5", bathrooms: "2" },
  },
  {
    place: "Annecy",
    name: "L’Appartement du Lac",
    description: "Une adresse lumineuse, pensée pour profiter du lac et rejoindre la vieille ville à pied.",
    image: "/guide-interior.png",
    href: "/logements/appartement-du-lac",
    stats: { surface: "82 m²", travelers: "4", bedrooms: "2", bathrooms: "1" },
  },
];

const serviceHighlights = [
  {
    icon: Sparkles,
    label: "Mise en valeur",
    copy: "Une présentation soignée pour mieux révéler votre bien.",
  },
  {
    icon: MessagesSquare,
    label: "Gestion voyageurs",
    copy: "Des échanges suivis, de la réservation au départ.",
  },
  {
    icon: BedDouble,
    label: "Ménage & linge",
    copy: "Un logement impeccable avant chaque arrivée.",
  },
  {
    icon: ClipboardCheck,
    label: "Suivi du logement",
    copy: "Contrôles et interventions coordonnés localement.",
  },
  {
    icon: Smartphone,
    label: "Guide MyStay",
    copy: "Les bonnes informations accessibles au bon moment.",
  },
];

const conciergeServices = [
  {
    number: "1",
    title: "Valorisation & diffusion",
    copy: "Présentation du logement, annonce soignée, calendrier et suivi des réservations : chaque détail contribue à mieux louer.",
  },
  {
    number: "2",
    title: "Accueil des voyageurs",
    copy: "Nous répondons aux voyageurs, préparons leur arrivée et restons leur interlocuteur tout au long du séjour.",
  },
  {
    number: "3",
    title: "Intendance du logement",
    copy: "Ménage, linge, contrôle et coordination des interventions : votre bien est suivi entre chaque séjour.",
  },
];

const guideSteps = [
  {
    icon: CarFront,
    label: "Accès & arrivée",
    title: "Une arrivée déjà préparée",
    copy: "Le voyageur retrouve en un seul lien les accès, les horaires et toutes les informations utiles avant même de prendre la route.",
  },
  {
    icon: Heart,
    label: "Séjour & découvertes",
    title: "Le bon conseil, au bon moment",
    copy: "Équipements, bonnes adresses et recommandations locales restent accessibles à tout moment, sans application à télécharger.",
  },
  {
    icon: Flower2,
    label: "Sérénité propriétaire",
    title: "Moins de questions, plus de sérénité",
    copy: "Les demandes répétitives diminuent, l’accueil gagne en cohérence et nous restons disponibles pour les besoins qui comptent vraiment.",
  },
];

export default function Home() {
  return (
    <SiteFrame>
        <Header />
        <main className="editorial-home">
          <section className="editorial-hero shell">
            <div className="editorial-hero-copy">
              <span className="eyebrow light">Conciergerie en Haute-Savoie</span>
              <h1>
                Votre logement, géré avec soin.
                <br />
                <em>Vos voyageurs, accueillis autrement.</em>
              </h1>
              <p>
                MyStay accompagne les propriétaires dans la gestion de leur
                location saisonnière, de la mise en valeur du bien jusqu’au
                départ des voyageurs.
              </p>
              <div className="editorial-hero-actions">
                <Link
                  className="button white"
                  href="/confier-mon-logement"
                >
                  Confier mon logement
                </Link>
                <a href="#services" className="editorial-text-link">
                  Découvrir nos services <span>↓</span>
                </a>
              </div>
            </div>
            <div className="editorial-hero-meta" aria-label="Services de conciergerie">
              <span><b>✓</b> Gestion complète</span>
              <span><b>✓</b> Présence locale</span>
              <span><b>✓</b> Guide digital inclus</span>
            </div>
          </section>

          <section className="editorial-intro shell section">
            <div className="editorial-intro-copy">
              <span className="eyebrow">La conciergerie MyStay</span>
              <h2>Votre bien mérite plus qu’une simple remise de clés.</h2>
              <p>
                Nous prenons soin du logement, de son image et de chaque
                voyageur. Notre accompagnement associe une présence humaine
                locale à des outils simples, pensés pour fluidifier le séjour.
              </p>
            </div>
          </section>

          <section className="editorial-content-strip shell" aria-label="Services MyStay">
            {serviceHighlights.map(({ icon: Icon, label, copy }, index) => (
              <article
                className={index === 0 ? "editorial-highlight-featured" : undefined}
                key={label}
              >
                <div className="editorial-highlight-heading">
                  <span className="editorial-highlight-icon" aria-hidden="true">
                    <Icon strokeWidth={1.7} />
                  </span>
                </div>
                <div className="editorial-highlight-copy">
                  <h3>{label}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
            <div className="editorial-content-action">
              <Link href="/concept" className="inline-link inline-link--button">
                Comprendre notre approche <span>→</span>
              </Link>
            </div>
          </section>

          <section className="editorial-services shell section" id="services">
            <div className="editorial-services-heading">
              <span className="eyebrow">Nos services</span>
              <h2>Une gestion attentive, avant, pendant et après chaque séjour.</h2>
              <p>
                Nous adaptons notre accompagnement à votre logement, à vos
                priorités et au niveau de délégation que vous recherchez.
              </p>
            </div>
            <div className="editorial-service-grid">
              {conciergeServices.map((service) => (
                <article key={service.number}>
                  <div className="editorial-service-title">
                    <span>{String(service.number).padStart(2, "0")}</span>
                    <h3>{service.title}</h3>
                  </div>
                  <p>{service.copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="editorial-catalog shell section">
            <div className="editorial-catalog-intro">
              <span className="eyebrow">Les logements confiés à MyStay</span>
              <h2>Des lieux que nous gérons comme s’ils étaient les nôtres.</h2>
              <p>
                Découvrez une sélection de biens accompagnés par notre
                conciergerie. Chacun bénéficie d’un suivi dédié et de son propre
                guide d’arrivée MyStay.
              </p>
              <Link href="/logements" className="inline-link catalog-button">
                Découvrir les logements <span>→</span>
              </Link>
            </div>
            <div className="editorial-property-grid">
              {properties.map((property) => (
                <PropertyCard key={property.name} {...property} />
              ))}
            </div>
          </section>

          <section className="editorial-process shell section">
            <div className="editorial-process-heading">
              <span className="eyebrow">Notre différence</span>
              <h2>Le guide MyStay prolonge notre accueil, même à distance.</h2>
              <p>
                Créé pour les logements que nous gérons, il rassemble les
                informations pratiques et les meilleures recommandations dans
                une expérience mobile simple et élégante.
              </p>
              <GuideModal
                className="editorial-guide-preview"
                label="Voir le guide d’exemple"
              />
            </div>
            <ol className="editorial-process-list">
              {guideSteps.map((step) => {
                const Icon = step.icon;

                return (
                  <li key={step.label}>
                    <div className="editorial-process-card-heading">
                      <span className="editorial-process-icon" aria-hidden="true">
                        <Icon />
                      </span>
                      <small>{step.label}</small>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="editorial-cta shell">
            <div>
              <span className="eyebrow light">Votre projet</span>
              <h2>Confiez-nous votre logement.<br />Gardez l’esprit libre.</h2>
            </div>
            <div>
              <p>
                Parlons de votre bien, de vos attentes et de la manière dont
                MyStay peut vous accompagner au quotidien.
              </p>
              <Link
                className="button white"
                href="/confier-mon-logement"
              >
                Échanger sur mon projet
              </Link>
            </div>
          </section>
        </main>
        <Footer />
    </SiteFrame>
  );
}
