import Link from "next/link";
import QRCode from "react-qr-code";
import { GuideModal } from "../guide-modal";
import { Footer, Header, SiteFrame } from "../ui";

const travelerGuideUrl =
  "https://www.mystay.city/guide/saint-gervais-les-bains?lodging=dc682b31-d390-4a3b-ae2e-e7342581535f";

const recurringQuestions = [
  "Comment accéder au logement ?",
  "Où se garer ?",
  "Quel est le code Wi-Fi ?",
  "Comment utiliser les équipements ?",
  "Que faire dans les environs ?",
  "Quelles sont les consignes de départ ?",
] as const;

const steps = [
  {
    number: "01",
    label: "Le logement",
    title: "Nous préparons le logement",
    copy: "Présentation, informations pratiques et organisation opérationnelle sont réunies avant la première arrivée.",
  },
  {
    number: "02",
    label: "Le séjour",
    title: "Nous accueillons les voyageurs",
    copy: "Notre équipe accompagne chaque séjour et reste l’interlocuteur des voyageurs, de la réservation au départ.",
  },
  {
    number: "03",
    label: "Le guide MyStay",
    title: "Le guide prend le relais",
    copy: "Accès, réponses et recommandations restent disponibles à tout moment sur smartphone, sans compte à créer.",
  },
] as const;

const benefits = [
  {
    audience: "Pour les propriétaires",
    title: "Plus de sérénité au quotidien.",
    items: [
      "Un interlocuteur pour coordonner le logement",
      "Une expérience d’accueil professionnelle",
      "Un suivi entre chaque séjour",
      "Un bien mieux présenté et valorisé",
    ],
  },
  {
    audience: "Pour les voyageurs",
    title: "Plus de liberté pendant le séjour.",
    items: [
      "Une équipe disponible et identifiable",
      "Toutes les informations immédiatement disponibles",
      "Aucun téléchargement obligatoire",
      "Des recommandations locales sélectionnées",
    ],
  },
] as const;

export default function Concept() {
  return (
    <SiteFrame>
      <Header />
      <main className="concept-page">
        <section className="concept-hero">
          <div className="shell concept-hero-inner">
            <div className="concept-hero-copy">
              <span className="eyebrow">Notre approche</span>
              <h1>
                Une conciergerie humaine,
                <br />
                <em>prolongée par le digital.</em>
              </h1>
              <p className="lead">
                Nous prenons en charge la gestion du logement et l’accueil des
                voyageurs. Notre guide digital complète cette présence avec les
                bonnes informations, disponibles au bon moment.
              </p>
              <div className="actions">
                <Link
                  className="button primary"
                  href="/confier-mon-logement"
                >
                  Confier mon logement
                </Link>
                <GuideModal
                  className="button concept-guide-button"
                  label="Voir le guide voyageur"
                />
              </div>
            </div>

            <div
              aria-label="Une propriétaire partage son guide MyStay avec un voyageur par QR code"
              className="concept-visual"
              role="img"
            >
              <div className="concept-card concept-card-owner">
                <span className="concept-card-icon" aria-hidden="true">⌂</span>
                <div>
                  <small>Équipe MyStay</small>
                  <strong>Prépare et accompagne le séjour</strong>
                </div>
              </div>
              <div
                aria-label="QR code vers le guide voyageur de Saint-Gervais"
                className="concept-flow"
              >
                <div className="concept-qr">
                  <QRCode
                    bgColor="#ffffff"
                    fgColor="#1e293b"
                    size={58}
                    title="Ouvrir le guide voyageur"
                    value={travelerGuideUrl}
                  />
                </div>
                <i aria-hidden="true">→</i>
              </div>
              <div className="concept-phone">
                <span className="mini-mark">m</span>
                <small>Votre séjour</small>
                <div className="concept-phone-screen">
                  <span>Bienvenue à</span>
                  <strong>Saint-Gervais</strong>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <div className="concept-card concept-card-guest">
                <span className="concept-card-icon" aria-hidden="true">♡</span>
                <div>
                  <small>Voyageur</small>
                  <strong>Profite pleinement du séjour</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="concept-problem section">
          <div className="shell concept-problem-grid">
            <div className="section-heading">
              <span className="eyebrow">L’accueil augmenté</span>
              <h2>Une présence humaine, soutenue par le bon outil.</h2>
              <p>
                Notre équipe reste disponible pour les voyageurs. Le guide
                anticipe les questions courantes afin que chacun trouve
                immédiatement les informations simples, sans perdre la qualité
                de l’échange humain.
              </p>
            </div>
            <div className="question-list">
              {recurringQuestions.map((question, index) => (
                <div key={question}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{question}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="concept-process section">
          <div className="shell">
            <div className="section-heading concept-process-heading">
              <span className="eyebrow">Notre accompagnement</span>
              <h2>Le logement, l’accueil et le digital réunis.</h2>
            </div>
            <ol className="concept-steps">
              {steps.map((step) => (
                <li key={step.number}>
                  <div className="concept-step-top">
                    <span>{step.number}</span>
                    <small>{step.label}</small>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="concept-vision section">
          <div className="shell concept-vision-grid">
            <div className="concept-vision-statement">
              <span className="eyebrow light">Notre vision</span>
              <blockquote>
                L’accueil doit rester humain.
                <br />
                <em>Le digital doit simplement le rendre plus fluide.</em>
              </blockquote>
            </div>

            <div className="concept-vision-content">
              <p>
                MyStay est d’abord une conciergerie locale. La technologie
                intervient là où elle est vraiment utile : pour anticiper,
                transmettre les bonnes informations et laisser plus de place à
                la qualité de l’accueil.
              </p>
              <div className="concept-vision-principles">
                <article>
                  <span>01</span>
                  <div>
                    <h3>Une présence locale et identifiable</h3>
                    <p>
                      Propriétaires et voyageurs savent toujours à qui
                      s’adresser, avant, pendant et après le séjour.
                    </p>
                  </div>
                </article>
                <article>
                  <span>02</span>
                  <div>
                    <h3>Des besoins anticipés avec justesse</h3>
                    <p>
                      Le guide rassemble les réponses essentielles sans
                      remplacer l’échange humain lorsqu’il compte vraiment.
                    </p>
                  </div>
                </article>
                <article>
                  <span>03</span>
                  <div>
                    <h3>Chaque logement valorisé durablement</h3>
                    <p>
                      Notre gestion protège le bien, soigne son image et
                      construit une expérience cohérente séjour après séjour.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="concept-benefits section shell">
          <div className="section-heading centered">
            <span className="eyebrow">Une même exigence</span>
            <h2>Une expérience plus sereine des deux côtés.</h2>
          </div>
          <div className="concept-benefit-grid">
            {benefits.map((benefit, index) => (
              <article key={benefit.audience}>
                <div className="concept-benefit-top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>{benefit.audience}</small>
                </div>
                <h3>{benefit.title}</h3>
                <ul>
                  {benefit.items.map((item) => (
                    <li key={item}><span>✓</span>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="concept-closing">
          <div className="shell concept-closing-inner">
            <span className="eyebrow light">Votre projet</span>
            <blockquote>
              Un logement bien géré.
              <br />
              <em>Des voyageurs bien accueillis.</em>
            </blockquote>
            <p>
              Parlons de votre bien, de vos priorités et de l’accompagnement
              adapté pour simplifier sa gestion au quotidien.
            </p>
            <div className="actions">
              <Link
                className="button primary"
                href="/confier-mon-logement"
              >
                Échanger sur mon projet
              </Link>
              <Link className="button concept-outline-button" href="/logements">
                Découvrir nos logements <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </SiteFrame>
  );
}
