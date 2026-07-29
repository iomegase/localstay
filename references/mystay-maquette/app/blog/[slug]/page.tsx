import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Footer, Header, SiteFrame } from "../../ui";
import { blogPosts, getBlogPost } from "../posts";

export function generateStaticParams() {
  return blogPosts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  return {
    title: post ? `${post.title} | MyStay` : "Article | MyStay",
    description: post?.excerpt,
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  const relatedPosts = blogPosts
    .filter((candidate) => candidate.slug !== slug)
    .slice(0, 3);

  if (!post) {
    return (
      <SiteFrame>
        <Header />
        <main className="property-not-found shell">
          <span className="eyebrow">Article introuvable</span>
          <h1>Cette publication n’est pas encore disponible.</h1>
          <Link className="button primary" href="/blog">
            Retour au blog <span>→</span>
          </Link>
        </main>
        <Footer />
      </SiteFrame>
    );
  }

  return (
    <SiteFrame>
      <Header />
      <main className="blog-article">
        <header className="blog-article-intro shell">
          <div className="blog-article-heading">
            <Link className="blog-article-back" href="/blog">
              <ArrowLeft size={16} strokeWidth={1.8} />
              Tous les articles
            </Link>
            <span className="eyebrow">{post.category}</span>
            <h1>{post.title}</h1>
            <p>{post.excerpt}</p>
            <div className="blog-article-meta">
              <span>{post.publishedAt}</span>
              <span>{post.readingTime} de lecture</span>
            </div>
          </div>
          <div
            aria-label={`Illustration de l’article ${post.title}`}
            className="blog-article-hero"
            role="img"
            style={{ backgroundImage: `url("${post.image}")` }}
          >
            <span>Journal MyStay · {post.category}</span>
          </div>
        </header>

        <div className="blog-article-layout shell">
          <aside className="blog-article-summary">
            <span>Dans cet article</span>
            <nav aria-label="Sommaire de l’article">
              <a href="#essentiel">L’essentiel</a>
              {post.sections.map((section, index) => (
                <a
                  href={`#section-${index + 1}`}
                  key={section.title}
                >
                  {section.title}
                </a>
              ))}
            </nav>
            <dl>
              <div>
                <dt>Publié le</dt>
                <dd>{post.publishedAt}</dd>
              </div>
              <div>
                <dt>Lecture</dt>
                <dd>{post.readingTime}</dd>
              </div>
            </dl>
          </aside>

          <article className="blog-article-body">
            <p className="blog-article-lead">{post.introduction}</p>

            <section className="blog-article-highlights" id="essentiel">
              <div className="blog-article-section-heading">
                <span>En bref</span>
                <h2>Les trois idées à retenir.</h2>
              </div>
              <ol>
                {post.highlights.map((highlight, index) => (
                  <li key={highlight}>
                    <span>0{index + 1}</span>
                    <p>{highlight}</p>
                  </li>
                ))}
              </ol>
            </section>

            {post.sections.map((section, index) => (
              <section
                className="blog-article-section"
                id={`section-${index + 1}`}
                key={section.title}
              >
                <span className="blog-article-section-number">
                  0{index + 1}
                </span>
                <div>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </article>
        </div>

        <aside className="blog-article-cta shell">
          <div>
            <span className="eyebrow light">Votre logement</span>
            <h2>Envie d’un accueil plus simple et plus attentif ?</h2>
          </div>
          <Link className="button white" href="/confier-mon-logement">
            Parler de mon projet
          </Link>
        </aside>

        <section className="blog-related shell">
          <div className="blog-related-heading">
            <span className="eyebrow">À lire ensuite</span>
            <h2>Continuer la lecture.</h2>
          </div>
          <div className="blog-related-grid">
            {relatedPosts.map((relatedPost) => (
              <Link
                className="blog-related-card"
                href={`/blog/${relatedPost.slug}`}
                key={relatedPost.slug}
              >
                <span
                  aria-hidden="true"
                  className="blog-related-image"
                  style={{ backgroundImage: `url("${relatedPost.image}")` }}
                />
                <span>
                  <small>{relatedPost.category}</small>
                  <strong>{relatedPost.title}</strong>
                </span>
                <ArrowUpRight aria-hidden="true" size={19} strokeWidth={1.7} />
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </SiteFrame>
  );
}
