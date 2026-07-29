import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Clock,
  MapPin,
  Mountain,
  Presentation,
  Users,
  Utensils,
} from "lucide-react";
import { Footer, Header, SiteFrame } from "../ui";

const services = [
  {
    icon: BedDouble,
    title: "Lieu & hébergement",
    copy: "Des chalets chaleureux, sélectionnés selon la taille de votre équipe, le niveau de confort attendu et votre programme.",
  },
  {
    icon: Presentation,
    title: "Temps de travail",
    copy: "Des espaces adaptés aux échanges, ateliers et prises de parole, avec les équipements utiles préparés en amont.",
  },
  {
    icon: Utensils,
    title: "Repas & attentions",
    copy: "Petits-déjeuners, pauses, déjeuners ou dîner convivial : nous composons une expérience cohérente avec votre rythme.",
  },
  {
    icon: Mountain,
    title: "Activités & mobilité",
    copy: "Randonnée, bien-être, découverte locale ou activité collective : chaque respiration trouve naturellement sa place.",
  },
] as const;

const steps = [
  {
    number: "01",
    title: "Vous partagez votre brief",
    copy: "Dates, participants, objectifs, budget et ambiance recherchée.",
  },
  {
    number: "02",
    title: "Nous dessinons le séjour",
    copy: "Lieu, hébergement, restauration, temps de travail et activités.",
  },
  {
    number: "03",
    title: "Nous coordonnons chaque détail",
    copy: "Un interlocuteur MyStay pilote les partenaires et la logistique.",
  },
  {
    number: "04",
    title: "Votre équipe profite",
    copy: "Le programme et les informations utiles restent accessibles simplement.",
  },
] as const;

const formats = [
  {
    title: "Comité de direction",
    copy: "Un cadre confidentiel pour décider, prendre du recul et aligner les priorités dans un environnement propice aux échanges.",
  },
  {
    title: "Séminaire résidentiel",
    copy: "Travail, hébergement, restauration et moments partagés réunis dans un même lieu, au rythme de votre équipe.",
  },
  {
    title: "Retraite d’équipe",
    copy: "Quelques jours pour renouer les liens, prendre de la hauteur et faire émerger collectivement de nouvelles idées.",
  },
] as const;

const placePrinciples = [
  {
    number: "01",
    title: "Tout réunir au même endroit",
    copy: "Hébergement, espaces de travail et moments informels se prolongent naturellement dans un lieu privatisé.",
  },
  {
    number: "02",
    title: "Créer le bon rythme",
    copy: "Des espaces pensés pour alterner concentration, échanges collectifs et temps de respiration.",
  },
  {
    number: "03",
    title: "Ouvrir de nouvelles perspectives",
    copy: "Entre lac et montagne, le décor offre le recul nécessaire pour faire émerger des idées nouvelles.",
  },
] as const;

const contactHref =
  "mailto:bonjour@mystay.city?subject=Projet%20de%20s%C3%A9minaire%20MyStay";

export default function Seminaires() {
  return (
    <SiteFrame>
      <Header />
      <main className="seminar-page">
        <section className="seminar-hero shell">
          <div className="seminar-hero-content">
            <span className="eyebrow light">Séminaires en Haute-Savoie</span>
            <h1>
              Réunir vos équipes.
              <br />
              <em>Prendre de la hauteur.</em>
            </h1>
            <p>
              MyStay organise des séminaires résidentiels à taille humaine dans
              des lieux inspirants, entre lac et montagne. Un seul interlocuteur
              coordonne le séjour, du premier brief au départ de votre équipe.
            </p>
            <div className="seminar-hero-actions">
              <Link className="button white" href="/confier-mon-logement">
                Parler de mon séminaire
              </Link>
            </div>
          </div>
          <div className="seminar-hero-meta">
            <span><MapPin aria-hidden="true" /> Haute-Savoie</span>
            <span><Users aria-hidden="true" /> Équipes à taille humaine</span>
            <span><Clock aria-hidden="true" /> Séjour sur mesure</span>
          </div>
        </section>

        <section className="seminar-intro shell section" id="accompagnement">
          <div className="seminar-section-heading">
            <span className="eyebrow">L’expérience MyStay</span>
            <h2>Un séminaire fluide, du lieu jusqu’au dernier détail.</h2>
            <p>
              Nous réunissons les prestations essentielles dans une proposition
              claire : hébergement, espaces de travail, restauration, activités
              et déplacements locaux. Vous gardez la vision, nous coordonnons le
              reste.
            </p>
          </div>

          <div className="seminar-service-grid">
            {services.map(({ icon: Icon, title, copy }) => (
              <article key={title}>
                <span className="seminar-card-icon" aria-hidden="true">
                  <Icon strokeWidth={1.7} />
                </span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="seminar-place">
          <div className="shell seminar-place-layout">
            <div className="seminar-place-manifesto">
              <span className="eyebrow light">Le bon cadre</span>
              <h2>
                Le lieu ne doit pas seulement accueillir.
                <em>Il doit donner envie de se retrouver.</em>
              </h2>
              <p className="seminar-place-intro">
                Un séminaire résidentiel fonctionne lorsque le cadre simplifie
                tout : travailler, partager, respirer et rester ensemble sans
                perdre de temps dans la logistique.
              </p>
            </div>

            <div className="seminar-place-copy">
              <ol className="seminar-place-list">
                {placePrinciples.map((principle) => (
                  <li key={principle.number}>
                    <span>{principle.number}</span>
                    <div>
                      <h3>{principle.title}</h3>
                      <p>{principle.copy}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link className="button seminar-place-button" href="/logements">
                Découvrir nos logements <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section className="seminar-formats shell section">
          <div className="seminar-section-heading">
            <span className="eyebrow">À chaque équipe son format</span>
            <h2>Des temps de travail qui laissent aussi place au collectif.</h2>
          </div>
          <div className="seminar-format-grid">
            {formats.map((format) => (
              <article key={format.title}>
                <h3>{format.title}</h3>
                <p>{format.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="seminar-process">
          <div className="shell seminar-process-layout">
            <div className="seminar-process-heading">
              <span className="eyebrow">Une organisation simple</span>
              <h2>
                Un seul interlocuteur.
                <em>Quatre étapes, aucun flou.</em>
              </h2>
              <p className="seminar-process-intro">
                Une méthode lisible pour avancer rapidement et rester concentré
                sur les objectifs de votre équipe. MyStay coordonne le lieu, les
                partenaires et le déroulé du séjour.
              </p>
            </div>
            <div className="seminar-process-copy">
              <ol className="seminar-process-list">
                {steps.map((step) => (
                  <li key={step.number}>
                    <span>{step.number}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.copy}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="seminar-cta shell" id="projet">
          <div>
            <span className="eyebrow light">Votre prochain séminaire</span>
            <h2>Un lieu inspirant.<br />Une organisation sereine.</h2>
          </div>
          <div>
            <p>
              Parlez-nous de votre équipe, de vos dates et de vos envies. Nous
              préparerons une première proposition adaptée à votre projet.
            </p>
            <a className="button seminar-cta-button" href={contactHref}>
              Échanger sur mon projet <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </SiteFrame>
  );
}
