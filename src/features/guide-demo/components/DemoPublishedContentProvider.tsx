'use client'

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { demoGuideData } from '@/features/guide-demo/demo-content'
import type { DemoPublishedContent } from '@/features/guide-demo/types'

const defaultPublishedContent: DemoPublishedContent = {
  lodgingCards: demoGuideData.lodgingCards,
  blogPosts: demoGuideData.blogPosts,
}

const DemoPublishedContentContext = createContext<DemoPublishedContent>(
  defaultPublishedContent,
)

export function DemoPublishedContentProvider({
  children,
  value,
}: {
  children: ReactNode
  value: DemoPublishedContent
}) {
  return (
    <DemoPublishedContentContext.Provider value={value}>
      {children}
    </DemoPublishedContentContext.Provider>
  )
}

export function useDemoPublishedContent(): DemoPublishedContent {
  return useContext(DemoPublishedContentContext)
}
