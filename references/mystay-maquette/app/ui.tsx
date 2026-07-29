import Link from "next/link";
import type { ReactNode } from "react";
import { BedDouble, Scan, ShowerHead, UserRound, Users } from "lucide-react";

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="editorial-stage">
      <div className="editorial-surface">{children}</div>
    </div>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      aria-label="MyStay — Accueil"
      className={`brand${light ? " brand-light" : ""}`}
      href="/"
    >
      <img
        alt="MyStay"
        className="brand-logo"
        src={light ? "/mystay-logo-approved-reversed@4x.png" : "/mystay-logo-approved@4x.png"}
      />
    </Link>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Navigation principale">
          <Link href="/#services">Nos services</Link>
          <Link href="/logements">Nos logements</Link>
          <Link href="/seminaires">Séminaires</Link>
          <Link href="/concept">Notre approche</Link>
          <Link href="/blog">Blog</Link>
        </nav>
        <Link
          className="header-login"
          href="/connexion"
          aria-label="Se connecter à l’espace propriétaire"
          title="Se connecter"
        >
          <UserRound aria-hidden="true" strokeWidth={1.8} />
        </Link>
        <Link
          className="button header-button"
          href="/confier-mon-logement"
        >
          Confier mon logement
        </Link>
        <details className="mobile-menu">
          <summary aria-label="Ouvrir le menu">☰</summary>
          <nav>
            <Link href="/#services">Nos services</Link>
            <Link href="/logements">Nos logements</Link>
            <Link href="/seminaires">Séminaires</Link>
            <Link href="/concept">Notre approche</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/connexion" className="mobile-login-link">
              <UserRound aria-hidden="true" strokeWidth={1.8} />
              Se connecter
            </Link>
            <Link href="/confier-mon-logement">Confier mon logement</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="shell footer-grid">
        <div className="footer-intro">
          <Brand light />
          <p>La conciergerie locale qui prend soin des logements et accueille chaque voyageur avec attention.</p>
          <div className="socials"><a href="#" aria-label="Instagram">ig</a><a href="#" aria-label="LinkedIn">in</a></div>
        </div>
        <div><h4>Découvrir</h4><Link href="/#services">Nos services</Link><Link href="/logements">Nos logements</Link><Link href="/seminaires">Séminaires</Link><Link href="/concept">Notre approche</Link><Link href="/blog">Le blog</Link></div>
        <div><h4>Propriétaires</h4><Link href="/confier-mon-logement">Confier un logement</Link><Link href="/connexion">Se connecter</Link><Link href="/confier-mon-logement">Aide & contact</Link></div>
        <div><h4>Nous contacter</h4><a href="mailto:bonjour@mystay.city">bonjour@mystay.city</a><p>Haute-Savoie, France</p></div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 MyStay. Tous droits réservés.</span>
        <div><a href="#">Mentions légales</a><a href="#">Confidentialité</a><a href="#">CGU</a></div>
      </div>
    </footer>
  );
}

export function PropertyCard({
  place,
  name,
  details,
  description,
  image,
  stats,
  href = "#",
}: {
  place: string;
  name: string;
  details?: string;
  description?: string;
  image: string;
  href?: string;
  stats?: {
    surface: string;
    travelers: string;
    bedrooms: string;
    bathrooms: string;
  };
}) {
  const isCatalogCard = Boolean(description && stats);

  return (
    <Link
      href={href}
      className={`property-card${isCatalogCard ? " property-card--catalog" : ""}`}
      aria-label={`Découvrir ${name}`}
    >
      <div
        className="property-image"
        style={isCatalogCard ? undefined : { backgroundImage: `url("${image}")` }}
      >
        {isCatalogCard && (
          <>
            <span
              aria-hidden="true"
              className="property-photo"
              style={{ backgroundImage: `url("${image}")` }}
            />
            <span className="property-location">{place}</span>
          </>
        )}
        {!isCatalogCard && <span className="heart" aria-hidden="true">♡</span>}
        {!isCatalogCard && <span className="view-property">Voir le logement ↗</span>}
      </div>
      {isCatalogCard ? (
        <>
          <div className="property-card-copy">
            <p className="place">{place}</p>
            <h3>{name}</h3>
            <p className="property-description">{description}</p>
          </div>
          <dl className="property-stats" aria-label={`Caractéristiques de ${name}`}>
            <div className="property-stat">
              <span className="property-stat-icon" aria-hidden="true"><Scan /></span>
              <div className="property-stat-copy"><dt>Surface</dt><dd>{stats?.surface}</dd></div>
            </div>
            <div className="property-stat">
              <span className="property-stat-icon" aria-hidden="true"><Users /></span>
              <div className="property-stat-copy"><dt>Voyageurs</dt><dd>{stats?.travelers}</dd></div>
            </div>
            <div className="property-stat">
              <span className="property-stat-icon" aria-hidden="true"><BedDouble /></span>
              <div className="property-stat-copy"><dt>Chambres</dt><dd>{stats?.bedrooms}</dd></div>
            </div>
            <div className="property-stat">
              <span className="property-stat-icon" aria-hidden="true"><ShowerHead /></span>
              <div className="property-stat-copy"><dt>Salles de bain</dt><dd>{stats?.bathrooms}</dd></div>
            </div>
          </dl>
        </>
      ) : (
        <>
          <p className="place">{place}</p>
          <h3>{name}</h3>
          <p className="details">{details}</p>
        </>
      )}
    </Link>
  );
}
