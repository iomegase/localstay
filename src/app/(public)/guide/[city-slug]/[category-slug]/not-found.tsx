import Link from 'next/link'

export default function CategoryNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
      <h1 className="font-serif italic text-2xl text-charcoal">Catégorie introuvable</h1>
      <Link
        href="/"
        className="text-xs font-bold uppercase tracking-widest text-pink-600 underline underline-offset-4"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}
