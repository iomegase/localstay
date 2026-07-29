import { Footer, Header, SiteFrame } from "../ui";

const process = [
  ["01", "Nous découvrons votre logement", "Nous échangeons sur ses atouts, son environnement et vos objectifs."],
  ["02", "Nous définissons vos priorités", "Niveau de délégation, disponibilité et expérience voyageur : l’accompagnement s’adapte à vos attentes."],
  ["03", "Nous organisons la mise en gestion", "Une proposition claire, un interlocuteur dédié et un lancement parfaitement coordonné."],
] as const;

export default function ConfierMonLogement() {
  return (
    <SiteFrame>
      <Header />
      <main className="owner-contact-page">
        <section className="owner-contact-hero shell">
          <div className="owner-contact-intro">
            <span className="eyebrow">Votre projet</span>
            <h1>Parlons de votre logement.</h1>
            <p>
              Quelques informations suffisent pour préparer un premier échange
              utile et vous proposer un accompagnement réellement adapté.
            </p>

            <div className="owner-contact-process" aria-label="Les étapes de notre prise de contact">
              {process.map(([number, title, copy]) => (
                <article key={number}>
                  <span>{number}</span>
                  <div>
                    <h2>{title}</h2>
                    <p>{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="owner-contact-card">
            <div className="owner-contact-card-heading">
              <span>Demande propriétaire</span>
              <h2>Confier mon logement à MyStay</h2>
              <p>Nous vous répondrons personnellement pour organiser un premier échange.</p>
            </div>

            <form
              action="mailto:bonjour@mystay.city?subject=Demande%20propri%C3%A9taire%20MyStay"
              className="owner-contact-form"
              encType="text/plain"
              method="post"
            >
              <div className="owner-form-grid">
                <label>
                  <span>Prénom et nom *</span>
                  <input autoComplete="name" name="Nom" placeholder="Votre nom" required type="text" />
                </label>
                <label>
                  <span>Adresse e-mail *</span>
                  <input autoComplete="email" name="Email" placeholder="vous@exemple.fr" required type="email" />
                </label>
                <label>
                  <span>Téléphone</span>
                  <input autoComplete="tel" name="Téléphone" placeholder="+33 6 00 00 00 00" type="tel" />
                </label>
                <label>
                  <span>Commune du logement *</span>
                  <input autoComplete="address-level2" name="Commune" placeholder="Ex. Saint-Gervais-les-Bains" required type="text" />
                </label>
                <label>
                  <span>Type de logement *</span>
                  <select defaultValue="" name="Type de logement" required>
                    <option disabled value="">Sélectionner</option>
                    <option>Appartement</option>
                    <option>Chalet</option>
                    <option>Maison</option>
                    <option>Autre</option>
                  </select>
                </label>
                <label>
                  <span>Capacité d’accueil</span>
                  <select defaultValue="" name="Capacité">
                    <option disabled value="">Sélectionner</option>
                    <option>1 à 4 voyageurs</option>
                    <option>5 à 8 voyageurs</option>
                    <option>9 à 12 voyageurs</option>
                    <option>13 voyageurs et plus</option>
                  </select>
                </label>
              </div>

              <label className="owner-form-wide">
                <span>Parlez-nous de votre projet</span>
                <textarea
                  name="Message"
                  placeholder="Décrivez brièvement le logement, sa situation actuelle et vos attentes."
                  rows={5}
                />
              </label>

              <label className="owner-form-consent">
                <input name="Consentement" required type="checkbox" value="Oui" />
                <span>
                  J’accepte que MyStay utilise ces informations uniquement pour
                  répondre à ma demande.
                </span>
              </label>

              <button className="button primary owner-form-submit" type="submit">
                Envoyer ma demande
              </button>
              <p className="owner-form-note">
                En envoyant le formulaire, votre messagerie préparera un e-mail
                adressé à bonjour@mystay.city.
              </p>
            </form>
          </div>
        </section>

        <section className="owner-contact-direct">
          <div className="shell">
            <span>Vous préférez nous écrire directement ?</span>
            <a href="mailto:bonjour@mystay.city">bonjour@mystay.city <b>↗</b></a>
          </div>
        </section>
      </main>
      <Footer />
    </SiteFrame>
  );
}
