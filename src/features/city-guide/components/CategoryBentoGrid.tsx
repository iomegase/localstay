'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import type { CategorySummary } from '@/features/city-guide/types'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import {
  getCategoryImage,
  getFallbackGradient,
} from '@/features/city-guide/lib/category-images'

const spring = { type: 'spring' as const, stiffness: 260, damping: 13 }

// Cadrage de l'image par slug (object-position). Défaut : object-center.
const CARD_IMAGE_POSITION: Record<string, string> = {
  culture: 'object-cover',
}

interface CategoryBentoGridProps {
  categories: CategorySummary[]
  citySlug: string
  lodgingId?: string | null
}

export function CategoryBentoGrid({ categories, citySlug, lodgingId }: CategoryBentoGridProps) {
  const reduce = useReducedMotion()

  function categoryHref(catSlug: string) {
    const base = `/guide/${citySlug}/${catSlug}`
    return lodgingId ? `${base}?lodging=${encodeURIComponent(lodgingId)}` : base
  }

  return (
    <motion.div
      key={citySlug}
      className="mt-6 grid grid-cols-2 gap-3"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.07 } } }}
    >
      {categories.flatMap((cat, index) => {
        const card = (
          <CategoryBentoCard
            key={cat.id}
            category={cat}
            href={categoryHref(cat.slug)}
            wide={index % 4 === 0}
            reduce={!!reduce}
          />
        )
        // Carte « Nos favoris » insérée à droite de Rando (logique à venir).
        if (cat.slug === 'rando') {
          return [card, <FavoritesCard key="nos-favoris" reduce={!!reduce} />]
        }
        return [card]
      })}
    </motion.div>
  )
}

function CategoryBentoCard({
  category,
  href,
  wide,
  reduce,
}: {
  category: CategorySummary
  href: string
  wide: boolean
  reduce: boolean
}) {
  const image = getCategoryImage(category.slug)
  const objectPosition = CARD_IMAGE_POSITION[category.slug] ?? 'object-center'

  return (
    <motion.div
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.85 },
        show: reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, transition: spring },
      }}
      whileHover={reduce ? undefined : { scale: 1.04 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className={wide ? 'col-span-2' : 'col-span-1'}
    >
      <Link
        href={href}
        className={`relative flex w-full items-end overflow-hidden rounded-3xl shadow-md ${
          wide ? 'aspect-[382/185]' : 'aspect-square'
        }`}
      >
        {image ? (
          <>
            <Image
              src={image}
              alt={category.name}
              fill
              unoptimized
              sizes="(max-width: 430px) 50vw, 215px"
              className={`object-cover ${objectPosition}`}
            />
            <span className="relative z-10 m-3 rounded-md bg-white/90 px-2 py-1 text-xs font-bold uppercase tracking-wide text-charcoal">
              {category.name}
            </span>
          </>
        ) : (
          <div
            className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${getFallbackGradient(category.slug)} p-3 text-white`}
          >
            <CategoryIcon iconSlug={category.icon} className="h-7 w-7" />
            <span className="text-xs font-bold uppercase tracking-wide">{category.name}</span>
          </div>
        )}
      </Link>
    </motion.div>
  )
}

function FavoritesCard({ reduce }: { reduce: boolean }) {
  // TODO(favoris): brancher la logique de récupération des favoris admin.
  // Pour l'instant la carte n'est pas navigante (pas de lien).
  function handleClick() {
    // À implémenter : ouvrir / charger les favoris.
  }

  return (
    <motion.div
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.85 },
        show: reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, transition: spring },
      }}
      whileHover={reduce ? undefined : { scale: 1.04 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className="col-span-1"
    >
      <button
        type="button"
        onClick={handleClick}
        className="relative flex aspect-square w-full items-end overflow-hidden rounded-3xl shadow-md"
      >
        <Image
          src="/home/nos-favoris.png"
          alt="Nos favoris"
          fill
          unoptimized
          sizes="(max-width: 430px) 50vw, 215px"
          className="object-cover"
        />
        <span className="relative z-10 m-3 rounded-md bg-white/90 px-2 py-1 text-xs font-bold uppercase tracking-wide text-charcoal">
          Nos favoris
        </span>
      </button>
    </motion.div>
  )
}
