import { Footer, Header, PropertyCard, SiteFrame } from "../ui";
import { properties } from "../properties";

export default function Logements() {
  return (
    <SiteFrame>
      <Header />
      <main className="catalog-page">
        <section className="page-hero">
          <div className="shell">
            <span className="eyebrow">Les logements confiés à MyStay</span>
            <h1>Des adresses que notre conciergerie accompagne au quotidien.</h1>
            <p>
              Montagne, lac ou cœur de village : découvrez les logements que
              nous gérons, préparons et valorisons, chacun avec son guide
              d’arrivée MyStay.
            </p>
          </div>
        </section>
        <section className="catalog shell">
          <div className="property-grid">
            {properties.map((property) => (
              <PropertyCard
                key={property.name}
                {...property}
                href={`/logements/${property.slug}`}
              />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </SiteFrame>
  );
}
