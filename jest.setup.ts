import '@testing-library/jest-dom'

// jsdom n'implémente pas IntersectionObserver, requis par framer-motion
// (whileInView). Mock minimal qui déclenche l'entrée immédiatement.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    private readonly callback: IntersectionObserverCallback

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
    }

    observe(target: Element): void {
      this.callback(
        [{ isIntersecting: true, target, intersectionRatio: 1 } as IntersectionObserverEntry],
        this,
      )
    }

    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }

  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver
}

// Spec 087 : le proxy lit l'état de maintenance ; en test, jamais de lecture de la vraie base
// (mode inactif par défaut). Les tests du mode maintenance utilisent `jest.unmock`.
jest.mock('@/features/maintenance/queries/maintenance', () => ({
  isMaintenanceEnabled: jest.fn(async () => false),
  getMaintenanceState: jest.fn(async () => ({ enabled: false, message: 'Nous améliorons MyStay. Le site revient très vite, merci de votre patience.' })),
  setMaintenanceState: jest.fn(),
  resetMaintenanceCache: jest.fn(),
}))
