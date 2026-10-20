import { create } from 'zustand'

export const TABS = [
  { id: 'showroom', label: 'Showroom' },
  { id: 'builder', label: 'Ensamble' },
  { id: 'tierlist', label: 'Tier List' },
  { id: '3d', label: 'Visor 3D' },
  { id: 'compare', label: 'Comparativa' },
] as const

export type TabId = (typeof TABS)[number]['id']
export type AppTab = TabId | 'part'
export type FamilyId = 'gpu' | 'cpu'
export type BrandId = 'nvidia' | 'amd' | 'intel'

const FAMILIES: FamilyId[] = ['gpu', 'cpu']
const BRANDS: BrandId[] = ['nvidia', 'amd', 'intel']

interface NavState {
  tab: AppTab
  family: FamilyId
  brand: BrandId
  viewerSlug: string | null
  compareA: string | null
  compareB: string | null
  partSlug: string | null
  setTab: (tab: TabId) => void
  setShowroom: (family: FamilyId, brand: BrandId) => void
  openPart: (slug: string, family: FamilyId) => void
  openViewer: (slug: string) => void
  setViewerSlug: (slug: string) => void
  setCompare: (left: string, right: string | null) => void
  openCompare: (left: string, right?: string | null) => void
}

function isFamily(value: string | undefined): value is FamilyId {
  return FAMILIES.includes(value as FamilyId)
}

function isBrand(value: string | undefined): value is BrandId {
  return BRANDS.includes(value as BrandId)
}

function isTab(value: string | undefined): value is TabId {
  return TABS.some((tab) => tab.id === value)
}

export function coerceBrand(family: FamilyId, brand: BrandId): BrandId {
  if (family === 'cpu' && brand === 'nvidia') return 'amd'
  return brand
}

function readHash(): Pick<NavState, 'tab' | 'family' | 'brand' | 'viewerSlug' | 'compareA' | 'compareB' | 'partSlug'> {
  const fallback = {
    tab: 'showroom' as const,
    family: 'gpu' as const,
    brand: 'nvidia' as const,
    viewerSlug: null,
    compareA: null,
    compareB: null,
    partSlug: null as string | null,
  }
  if (typeof window === 'undefined') return fallback
  const [head, a, b, c] = window.location.hash.replace(/^#\/?/, '').split('/')
  if (head === 'gpu' || head === 'cpu') return { ...fallback, tab: 'part', family: head, partSlug: a || null }
  if (head === 'showroom' || head === '' || head == null) {
    const family = isFamily(a) ? a : 'gpu'
    const brand = coerceBrand(family, isBrand(b) ? b : 'nvidia')
    if (c) return { ...fallback, tab: 'part', family, brand, partSlug: c }
    return { ...fallback, tab: 'showroom', family, brand }
  }
  if (head === 'viewer' || head === '3d') return { ...fallback, tab: '3d', viewerSlug: a || null }
  if (head === 'compare') return { ...fallback, tab: 'compare', compareA: a || null, compareB: b || null }
  if (head === 'builder' || head === 'ensamble') return { ...fallback, tab: 'builder' }
  if (head === 'tierlist' || head === 'tiers') return { ...fallback, tab: 'tierlist' }
  if (isTab(head)) return { ...fallback, tab: head }
  return fallback
}

function hashFor(state: NavState): string {
  if (state.tab === 'part' && state.partSlug) return `#/${state.family}/${state.partSlug}`
  if (state.tab === 'showroom') return `#/showroom/${state.family}/${state.brand}`
  if (state.tab === '3d') return state.viewerSlug ? `#/viewer/${state.viewerSlug}` : '#/viewer'
  if (state.tab === 'compare') {
    if (!state.compareA) return '#/compare'
    return state.compareB ? `#/compare/${state.compareA}/${state.compareB}` : `#/compare/${state.compareA}`
  }
  if (state.tab === 'builder') return '#/builder'
  return '#/tierlist'
}

let applyingHash = false

function publish(state: NavState) {
  if (applyingHash || typeof window === 'undefined') return
  const hash = hashFor(state)
  if (window.location.hash !== hash) window.history.pushState(null, '', hash)
}

export const useNavStore = create<NavState>((set, get) => ({
  ...readHash(),
  setTab: (tab) => {
    set({ tab, partSlug: null })
    publish(get())
  },
  setShowroom: (family, brand) => {
    set({ tab: 'showroom', family, brand: coerceBrand(family, brand), partSlug: null })
    publish(get())
  },
  openPart: (slug, family) => {
    set({ tab: 'part', partSlug: slug, family })
    publish(get())
  },
  openViewer: (slug) => {
    set({ tab: '3d', viewerSlug: slug })
    publish(get())
  },
  setViewerSlug: (slug) => {
    set({ viewerSlug: slug })
    if (get().tab === '3d') publish(get())
  },
  setCompare: (left, right) => {
    set({ compareA: left, compareB: right })
    if (get().tab === 'compare') publish(get())
  },
  openCompare: (left, right = null) => {
    set({ tab: 'compare', compareA: left, compareB: right })
    publish(get())
  },
}))

if (typeof window !== 'undefined') {
  const hash = hashFor(useNavStore.getState())
  if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
  window.addEventListener('hashchange', () => {
    applyingHash = true
    useNavStore.setState(readHash())
    applyingHash = false
  })
}
