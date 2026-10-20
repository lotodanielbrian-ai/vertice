import type { BuildSelection, BuildSlot, MarketOffer } from '@pc/shared'
import { create } from 'zustand'

export const BUILDER_STEPS = [
  'cpu',
  'motherboard',
  'ram',
  'gpu',
  'storage',
  'psu',
  'case',
  'cooler',
  'monitor',
  'peripheral',
] as const

export type BuilderStep = (typeof BUILDER_STEPS)[number]
export type MarketSlot = Exclude<BuilderStep, 'cpu' | 'gpu'>

export interface RamLine {
  lineId: string
  offer: MarketOffer
  modules: number
}

const emptySelection: BuildSelection = {
  cpu: null,
  motherboard: null,
  ram: null,
  cooler: null,
  gpu: null,
  case: null,
  psu: null,
  storage: null,
}

function emptyOffers(): Record<MarketSlot, MarketOffer | null> {
  return {
    motherboard: null,
    ram: null,
    cooler: null,
    storage: null,
    psu: null,
    case: null,
    monitor: null,
    peripheral: null,
  }
}

interface BuildState {
  selection: BuildSelection
  offers: Record<MarketSlot, MarketOffer | null>
  drives: MarketOffer[]
  ramLines: RamLine[]
  stockCooler: boolean
  useIgpu: boolean
  gpuOffer: MarketOffer | null
  cpuOffer: MarketOffer | null
  step: number
  onlyCompatible: boolean
  setSlot: (slot: BuildSlot, slug: string) => void
  assign: (slot: BuildSlot, slug: string) => void
  setOffer: (slot: MarketSlot, offer: MarketOffer | null) => void
  addDrive: (offer: MarketOffer) => void
  removeDrive: (id: string) => void
  addRam: (line: Omit<RamLine, 'lineId'>) => void
  removeRam: (lineId: string) => void
  setStockCooler: (value: boolean) => void
  setUseIgpu: (value: boolean) => void
  setGpuOffer: (offer: MarketOffer | null, slug: string | null) => void
  setCpuOffer: (offer: MarketOffer | null, slug: string | null) => void
  apply: (selection: BuildSelection) => void
  setStep: (step: number) => void
  setOnlyCompatible: (value: boolean) => void
  clearFrom: (slot: BuildSlot) => void
}

function isMarketSlot(step: BuilderStep): step is MarketSlot {
  return step !== 'cpu' && step !== 'gpu'
}

export const useBuildStore = create<BuildState>((set) => ({
  selection: emptySelection,
  offers: emptyOffers(),
  drives: [],
  ramLines: [],
  stockCooler: false,
  useIgpu: false,
  gpuOffer: null,
  cpuOffer: null,
  step: 0,
  onlyCompatible: true,
  setSlot: (slot, slug) =>
    set((state) => {
      const index = BUILDER_STEPS.indexOf(slot)
      const step = index === state.step && index < BUILDER_STEPS.length - 1 ? index + 1 : state.step
      return { selection: { ...state.selection, [slot]: slug }, step }
    }),
  assign: (slot, slug) => set((state) => ({ selection: { ...state.selection, [slot]: slug } })),
  setOffer: (slot, offer) => set((state) => ({ offers: { ...state.offers, [slot]: offer }, stockCooler: slot === 'cooler' ? false : state.stockCooler })),
  addDrive: (offer) => set((state) => (
    state.drives.length >= 4 || state.drives.some((item) => item.id === offer.id)
      ? state
      : { drives: [...state.drives, offer] }
  )),
  removeDrive: (id) => set((state) => ({ drives: state.drives.filter((item) => item.id !== id) })),
  addRam: (line) => set((state) => ({
    ramLines: [...state.ramLines, { ...line, lineId: `${line.offer.id}-${state.ramLines.length}-${Date.now()}` }],
  })),
  removeRam: (lineId) => set((state) => ({ ramLines: state.ramLines.filter((item) => item.lineId !== lineId) })),
  setStockCooler: (value) => set((state) => ({
    stockCooler: value,
    offers: value ? { ...state.offers, cooler: null } : state.offers,
  })),
  setUseIgpu: (value) => set((state) => ({
    useIgpu: value,
    gpuOffer: value ? null : state.gpuOffer,
    selection: value ? { ...state.selection, gpu: null } : state.selection,
  })),
  setGpuOffer: (offer, slug) => set((state) => ({
    gpuOffer: offer,
    useIgpu: false,
    selection: { ...state.selection, gpu: slug },
  })),
  setCpuOffer: (offer, slug) => set((state) => ({
    cpuOffer: offer,
    selection: { ...state.selection, cpu: slug },
  })),
  apply: (selection) => set({
    selection,
    offers: emptyOffers(),
    drives: [],
    ramLines: [],
    stockCooler: false,
    useIgpu: false,
    gpuOffer: null,
    cpuOffer: null,
    step: 0,
  }),
  setStep: (step) => set({ step }),
  setOnlyCompatible: (onlyCompatible) => set({ onlyCompatible }),
  clearFrom: (slot) =>
    set((state) => {
      const index = BUILDER_STEPS.indexOf(slot)
      const selection = { ...state.selection }
      const offers = { ...state.offers }
      let { drives, ramLines, stockCooler, useIgpu, gpuOffer, cpuOffer } = state
      for (const key of BUILDER_STEPS.slice(Math.max(index, 0))) {
        if (key === 'storage') drives = []
        else if (key === 'ram') ramLines = []
        else if (key === 'cooler') {
          stockCooler = false
          offers.cooler = null
        } else if (key === 'gpu') {
          useIgpu = false
          gpuOffer = null
          selection.gpu = null
        } else if (key === 'cpu') {
          cpuOffer = null
          selection.cpu = null
        } else if (isMarketSlot(key)) offers[key] = null
      }
      return { selection, offers, drives, ramLines, stockCooler, useIgpu, gpuOffer, cpuOffer, step: Math.max(index, 0) }
    }),
}))
