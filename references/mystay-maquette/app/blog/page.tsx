import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Footer, Header, SiteFrame } from "../ui";
import { blogCategories, blogPosts } from "./posts";

export const metadata: Metadata = {
  title: "Blog & inspirations | MyStay",
  description:
    "Conseils pour les propriétaires, accueil des voyageurs et inspirations locales par la conciergerie MyStay.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;
  const activeCategory = categorie
    ? blogCategories.find(
        (category) =>
          category.toLocaleLowerCase("fr") ===
          categorie.toLocaleLowerCase("fr"),
      ) ?? "Toutes"
    : "Toutes";
  const posts =
    activeCategory === "Toutes"
      ? blogPosts
      : blogPosts.filter((post) => post.category === activeCategory);

  return (
    <SiteFrame>
      <Header />
      <main className="blog-page">
        <section className="blog-heading shell">
          <span className="eyebrow">Journal MyStay</span>
          <h1>Inspirations, conciergerie.</h1>
          <p>
            Conseils aux propriétaires, accueil des voyageurs et regards
            locaux : des ressources simples pour mieux louer et mieux recevoir.
          </p>
          <nav aria-label="Fil d’Ariane" className="blog-breadcrumb">
            <Link href="/">Accueil</Link>
            <span>/</span>
            <span>Blog</span>
          </nav>
        </section>

        <section className="blog-content shell">
          <nav aria-label="Catégories du blog" className="blog-filters">
            {blogCategories.map((category) => {
              const href =
                category === "Toutes"
                  ? "/blog"
                  : `/blog?categorie=${encodeURIComponent(category)}`;

              return (
                <Link
                  className={category === activeCategory ? "active" : ""}
                  href={href}
                  key={category}
                >
                  {category}
                </Link>
              );
            })}
          </nav>

          <div className="blog-grid">
            {posts.map((post) => (
              <Link
                aria-label={`Lire l’article : ${post.title}`}
                className="blog-card"
                href={`/blog/${post.slug}`}
                key={post.slug}
              >
                <span
                  aria-hidden="true"
                  className="blog-card-image"
                  style={{ backgroundImage: `url("${post.image}")` }}
                />
                <span className="blog-card-overlay" />
                <span className="blog-card-category">{post.category}</span>
                <span className="blog-card-arrow" aria-hidden="true">
                  <ArrowUpRight size={18} strokeWidth={1.7} />
                </span>
                <span className="blog-card-copy">
                  <strong>{post.title}</strong>
                  <small>{post.readingTime} de lecture</small>
                </span>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <p className="blog-empty">Aucun article dans cette catégorie.</p>
          )}
        </section>
      </main>
      <Footer />
    </SiteFrame>
  );
}
