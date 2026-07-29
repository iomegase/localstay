import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    id: "restaurants",
    icon: "♨",
    title: "Restaurant",
    places: [
      {
        name: "L'Étable des Cimes",
        hours: "Ouvre aujourd'hui à 18h",
        status: "Fermé",
        image: "/guide-interior.png",
        featured: true,
      },
      {
        name: "Le Galeta",
        hours: "Ouvre à 11h30",
        status: "Fermé",
        image: "/hero-chalet.png",
      },
      {
        name: "Rond de Carotte",
        hours: "Ouvre à 9h",
        status: "Fermé",
        image: "/guide-interior.png",
      },
    ],
  },
  {
    id: "boulangeries",
    icon: "⌁",
    title: "Boulangerie",
    places: [
      {
        name: "Aux petits gourmands",
        hours: "Ferme à 19h",
        status: "Ouvert",
        image: "/hero-chalet.png",
        featured: true,
      },
      {
        name: "Pin Pin · Le Fayet",
        hours: "Ouvre à 10h",
        status: "Fermé",
        image: "/guide-interior.png",
      },
      {
        name: "La Potinière",
        hours: "Ouvre à 8h",
        status: "Fermé",
        image: "/hero-chalet.png",
      },
    ],
  },
  {
    id: "randos",
    icon: "⌃",
    title: "Rando",
    places: [
      {
        name: "L'Alpage de Porcherey",
        hours: "Une vue magnifique sur le Mont-Blanc",
        image: "/hero-chalet.png",
        featured: true,
      },
      {
        name: "Les chalets de Miage",
        hours: "4h30 · Niveau moyen",
        image: "/guide-interior.png",
      },
      {
        name: "Le col de Tricot",
        hours: "6h · Niveau sportif",
        image: "/hero-chalet.png",
      },
    ],
  },
  {
    id: "mobilite",
    icon: "↟",
    title: "Mobilité",
    places: [
      {
        name: "Le Tramway du Mont-Blanc",
        hours: "Départs depuis Saint-Gervais",
        status: "Ouvert",
        image: "/guide-interior.png",
        featured: true,
      },
      {
        name: "La Valléen",
        hours: "Liaison gare · centre-ville",
        image: "/hero-chalet.png",
      },
      {
        name: "Navette gratuite",
        hours: "Toutes les 30 minutes",
        image: "/guide-interior.png",
      },
    ],
  },
];

function PlaceCard({
  name,
  hours,
  status,
  image,
  featured = false,
}: {
  name: string;
  hours: string;
  status?: string;
  image: string;
  featured?: boolean;
}) {
  return (
    <a
      className={`stay-place-card${featured ? " featured" : ""}`}
      href="#"
      aria-label={`Découvrir ${name}`}
    >
      <Image
        src={image}
        alt=""
        fill
        unoptimized
        sizes={featured ? "396px" : "192px"}
      />
      <span className="stay-card-shade" />
      {status && (
        <span className={`stay-status ${status === "Ouvert" ? "open" : ""}`}>
          <i /> {status}
        </span>
      )}
      <span className="stay-place-copy">
        <strong>{name}</strong>
        <small>{hours}</small>
        {featured && <span className="stay-place-link">Voir le lieu <b>→</b></span>}
      </span>
    </a>
  );
}

export default function GuideExemple() {
  return (
    <div className="stay-guide-page">
      <header className="stay-guide-header">
        <Link href="/" aria-label="Retour à MyStay" className="stay-mini-brand">
          my<span>stay</span>
        </Link>
        <details className="stay-menu">
          <summary aria-label="Ouvrir le menu"><span /><span /></summary>
          <nav>
            <Link href="/">Accueil MyStay</Link>
            <Link href="/logements">Nos logements</Link>
            <a href="#informations">Informations du séjour</a>
          </nav>
        </details>
      </header>

      <main className="stay-guide-main" id="recommandations">
        <aside className="stay-guide-sidebar">
          <section className="stay-intro-card">
            <h1>Les recommandations<br />de Marie &amp; Antoine</h1>
            <p>Une sélection personnelle de vos hôtes pour profiter de Saint-Gervais-les-Bains.</p>

            <div className="stay-lodging-card">
              <span>Votre logement</span>
              <h2>Le Refuge des Cimes</h2>
              <div className="stay-stats">
                <div><b>12</b><small>Lieux</small></div>
                <div><b>5</b><small>Catégories</small></div>
                <div><b>1</b><small>Ville</small></div>
              </div>
            </div>
          </section>
        </aside>

        <div className="stay-category-feed">
          {categories.map((category) => (
            <section className="stay-category" id={category.id} key={category.id}>
              <div className="stay-category-title">
                <span aria-hidden="true">{category.icon}</span>
                <h2>{category.title}</h2>
              </div>
              <div className="stay-places-grid">
                {category.places.map((place) => <PlaceCard key={place.name} {...place} />)}
              </div>
            </section>
          ))}
        </div>

        <aside className="stay-guide-info-rail">
          <section className="stay-information-card" id="informations">
            <span className="stay-info-kicker">Votre séjour</span>
            <h2>Les informations essentielles</h2>
            <div className="stay-info-list">
              <div><span>⌂</span><p><small>Arrivée</small><b>À partir de 16h</b></p><em>›</em></div>
              <div><span>⌁</span><p><small>Wi-Fi</small><b>MYStay_Chalet</b></p><em>›</em></div>
              <div><span>✓</span><p><small>Départ</small><b>Avant 10h</b></p><em>›</em></div>
            </div>
          </section>
        </aside>
      </main>

      <nav className="stay-bottom-nav" aria-label="Navigation du guide">
        <a className="active" href="#recommandations">
          <span>♡</span><small>Coup de<br />cœur</small>
        </a>
        <a href="#informations">
          <span>⌂</span><small>Guide<br />logement</small>
        </a>
        <a href="#">
          <span>▧</span><small>Carte</small>
        </a>
      </nav>
    </div>
  );
}
