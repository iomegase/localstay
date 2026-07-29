import Link from "next/link";
import { Footer, Header, SiteFrame } from "../ui";

export default function ConnexionPage() {
  return (
    <SiteFrame>
      <Header />
      <main className="login-page">
        <div className="shell login-shell">
          <section className="login-intro">
            <span className="eyebrow">Espace propriétaire</span>
            <h1>Retrouvez votre logement et son suivi.</h1>
            <p>
              Connectez-vous pour accéder aux informations de votre bien, aux
              séjours et aux outils mis à votre disposition par MyStay.
            </p>
          </section>

          <section className="login-card" aria-labelledby="login-title">
            <h2 id="login-title">Se connecter</h2>
            <p>Renseignez les identifiants associés à votre espace propriétaire.</p>
            <form className="login-form">
              <label>
                Adresse e-mail
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="vous@exemple.fr"
                  required
                />
              </label>
              <label>
                Mot de passe
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  required
                />
              </label>
              <button className="button login-submit" type="submit">
                Se connecter
              </button>
            </form>
            <Link href="/confier-mon-logement" className="login-help">
              Besoin d’aide pour accéder à votre espace ?
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </SiteFrame>
  );
}
