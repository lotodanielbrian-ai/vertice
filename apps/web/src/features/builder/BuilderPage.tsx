import { invalidatedSlots, type Analysis, type EngineContext } from '@pc/engine'
import type { CatalogItem, MarketCategory, MarketOffer, Tier } from '@pc/shared'
import { useQueries } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { tierClass } from '../../lib/format'
import { fetchMarket, formatArs, matchCatalogCpu, matchCatalogGpu } from '../../lib/market'
import { BUILDER_STEPS, useBuildStore, type BuilderStep, type MarketSlot } from '../../store'
import { BottleneckHeatmap, IssuePanel, PowerCurve, UpgradeList } from '../analysis/AnalysisPanels'
import { capacityGb, coolerWatts, coreCount, cpuLoadWatts, cpuSocketOf, driveKind, formFactors, includesStockCooler, marketHints, matchesCase, motherSlots, nvmeGen, offerFit, psuCert, ramGen, ramGensOf, ramModules, socketsIn, towerKind, videoMemory, wattsOf, type CaseFilter, type Fit, type FitContext, type PsuCert } from './fit'
import { SlotIcon } from './SlotIcon'

const COPY: Record<BuilderStep, { title: string; help: string }> = {
  cpu: {
    title: 'Elegí tu procesador',
    help: 'Son procesadores publicados en tiendas, con la foto, el precio en pesos y el enlace.',
  },
  motherboard: {
    title: 'Elegí tu motherboard',
    help: 'Tiene que compartir el socket con el procesador. Si el título no lo dice, queda como sin dato.',
  },
  ram: {
    title: 'Elegí tu memoria',
    help: 'La generación (DDR4 o DDR5) tiene que ser la que acepta el procesador.',
  },
  gpu: {
    title: 'Elegí tu placa de video',
    help: 'Son placas que hay en tiendas, con el precio en pesos. Si el procesador trae gráfica, podés usarla.',
  },
  storage: {
    title: 'Elegí tu almacenamiento',
    help: 'Podés agregar más de un disco y seguir cuando termines.',
  },
  psu: {
    title: 'Elegí tu fuente',
    help: 'Tiene que cubrir los watts que piden el procesador y la placa.',
  },
  case: {
    title: 'Elegí tu gabinete',
    help: 'El tamaño tiene que alcanzar para la motherboard.',
  },
  cooler: {
    title: 'Elegí tu cooler',
    help: 'Si el procesador trae uno, podés usarlo, saltar el paso o comprar otro.',
  },
  monitor: {
    title: 'Elegí tu monitor',
    help: 'Opcional. Solo suma al total en pesos.',
  },
  peripheral: {
    title: 'Elegí un periférico',
    help: 'Opcional. Buscá teclado, mouse o auriculares. Solo suma al total.',
  },
}

const SLOT_LABEL: Record<BuilderStep, string> = {
  cpu: 'Procesador',
  motherboard: 'Motherboard',
  ram: 'Memoria',
  gpu: 'Placa de video',
  storage: 'Almacenamiento',
  psu: 'Fuente',
  case: 'Gabinete',
  cooler: 'Cooler',
  monitor: 'Monitor',
  peripheral: 'Periféricos',
}

function isMarket(step: BuilderStep): step is MarketSlot {
  return step !== 'cpu' && step !== 'gpu'
}

const CORE_COUNTS = [2, 4, 6, 8, 12, 16, 24, 32]
const VRAM_SIZES = [2, 4, 6, 8, 10, 12, 16, 24]
const GDDR_TYPES = ['GDDR3', 'GDDR4', 'GDDR5', 'GDDR6', 'GDDR6X', 'GDDR7']
const CASE_CHIPS: { id: CaseFilter; label: string; query: string }[] = [
  { id: 'atx', label: 'ATX', query: 'ATX' },
  { id: 'matx', label: 'mATX', query: 'MATX' },
  { id: 'itx', label: 'ITX', query: 'ITX' },
  { id: 'e-atx', label: 'E-ATX', query: 'E-ATX' },
  { id: 'full', label: 'Full tower', query: 'full tower' },
  { id: 'mid', label: 'Mid tower', query: 'mid tower' },
  { id: 'low', label: 'Low tower', query: 'mini tower' },
]

function offerBrand(name: string): 'nvidia' | 'amd' | 'intel' | null {
  if (/ryzen|athlon|\bamd\b/i.test(name)) return 'amd'
  if (/nvidia|geforce|\brtx\b|\bgtx\b/i.test(name)) return 'nvidia'
  if (/intel|\barc\b|core\s*ultra|\bcore\s*i[3579]\b/i.test(name)) return 'intel'
  if (/radeon|\brx\s*\d/i.test(name)) return 'amd'
  return null
}

interface ReceiptLine {
  key: string
  name: string
  price: number
  store: string | null
  url: string | null
  imageUrl: string | null
  detail: string
}

function receiptLine(key: string, offer: MarketOffer, detail: string): ReceiptLine {
  return { key, name: offer.name, price: offer.priceArs, store: offer.store, url: offer.url, imageUrl: offer.imageUrl, detail }
}

function chipClass(active: boolean): string {
  return `rounded-full px-3 py-1 text-[10px] font-black uppercase ${active ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300'}`
}

function traitsOf(kind: string, name: string, cpu: CatalogItem | null): string {
  const bits: string[] = []
  if (kind === 'cpu') {
    const cores = coreCount(name)
    if (cores) bits.push(`${cores} núcleos`)
    if (cpu?.cpu?.socketName) bits.push(cpu.cpu.socketName)
  } else if (kind === 'motherboard') {
    const sockets = socketsIn(name)
    if (sockets.length > 0) bits.push(sockets.join(' / '))
    const memory = ramGen(name)
    if (memory) bits.push(memory.toUpperCase())
  } else if (kind === 'ram') {
    const gb = capacityGb(name)
    if (gb) bits.push(gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`)
    const memory = ramGen(name)
    if (memory) bits.push(memory.toUpperCase())
    const modules = ramModules(name)
    if (modules > 1) bits.push(`${modules} módulos`)
  } else if (kind === 'gpu') {
    const gb = capacityGb(name)
    if (gb) bits.push(`${gb} GB`)
    const memory = videoMemory(name)
    if (memory) bits.push(memory)
  } else if (kind === 'storage') {
    const kindDrive = driveKind(name)
    if (kindDrive === 'hdd') bits.push('HDD')
    else if (kindDrive === 'ssd25') bits.push('SSD 2.5')
    else if (kindDrive === 'm2') bits.push('M.2')
    const gen = nvmeGen(name)
    if (gen) bits.push(`Gen${gen}`)
    const gb = capacityGb(name)
    if (gb) bits.push(gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`)
  } else if (kind === 'psu') {
    const watts = wattsOf(name)
    if (watts) bits.push(`${watts} W`)
    const cert = psuCert(name)
    if (cert) bits.push(cert === 'white' ? '80 Plus' : cert)
  } else if (kind === 'case') {
    const sizes = formFactors(name)
    if (sizes.length > 0) bits.push(sizes.map((size) => size === 'e-atx' ? 'E-ATX' : size === 'matx' ? 'mATX' : size.toUpperCase()).join(' / '))
    const tower = towerKind(name)
    if (tower === 'full') bits.push('Full tower')
    else if (tower === 'mid') bits.push('Mid tower')
    else if (tower === 'low') bits.push('Low tower')
  } else if (kind === 'cooler') {
    const watts = coolerWatts(name)
    if (watts) bits.push(`${watts} W`)
  }
  const haystack = name.toUpperCase()
  return bits.filter((bit) => !haystack.includes(bit.toUpperCase())).join(' · ')
}

function fitClass(status: Fit): string {
  if (status === 'compatible') return 'text-emerald-300'
  if (status === 'incompatible') return 'text-rose-300'
  return 'text-slate-400'
}

function fitLabel(status: Fit): string {
  if (status === 'compatible') return 'Compatible'
  if (status === 'incompatible') return 'Incompatible'
  return 'Sin dato'
}

export function BuilderPage({
  items,
  analysis,
  context,
}: {
  items: CatalogItem[]
  ranks: Map<string, Tier>
  analysis: Analysis
  context: EngineContext
}) {
  const selection = useBuildStore((state) => state.selection)
  const offers = useBuildStore((state) => state.offers)
  const drives = useBuildStore((state) => state.drives)
  const ramLines = useBuildStore((state) => state.ramLines)
  const stockCooler = useBuildStore((state) => state.stockCooler)
  const useIgpu = useBuildStore((state) => state.useIgpu)
  const gpuOffer = useBuildStore((state) => state.gpuOffer)
  const cpuOffer = useBuildStore((state) => state.cpuOffer)
  const setCpuOffer = useBuildStore((state) => state.setCpuOffer)
  const addDrive = useBuildStore((state) => state.addDrive)
  const removeDrive = useBuildStore((state) => state.removeDrive)
  const addRam = useBuildStore((state) => state.addRam)
  const removeRam = useBuildStore((state) => state.removeRam)
  const setStockCooler = useBuildStore((state) => state.setStockCooler)
  const setUseIgpu = useBuildStore((state) => state.setUseIgpu)
  const setGpuOffer = useBuildStore((state) => state.setGpuOffer)
  const stepIndex = useBuildStore((state) => state.step)
  const onlyCompatible = useBuildStore((state) => state.onlyCompatible)
  const setOffer = useBuildStore((state) => state.setOffer)
  const setStep = useBuildStore((state) => state.setStep)
  const setOnlyCompatible = useBuildStore((state) => state.setOnlyCompatible)
  const clearFrom = useBuildStore((state) => state.clearFrom)
  const step = BUILDER_STEPS[stepIndex] ?? 'cpu'
  const [query, setQuery] = useState('')
  const [deferred, setDeferred] = useState('')
  const [page, setPage] = useState(1)
  const [brand, setBrand] = useState<'all' | 'nvidia' | 'amd' | 'intel'>('all')
  const [driveFilter, setDriveFilter] = useState<'all' | 'hdd' | 'ssd25' | 'm2'>('all')
  const [genFilter, setGenFilter] = useState<number | 'all'>('all')
  const [sizeFilter, setSizeFilter] = useState<number | 'all'>('all')
  const [certFilter, setCertFilter] = useState<PsuCert | 'all'>('all')
  const [coreFilter, setCoreFilter] = useState<number | 'all'>('all')
  const [vramFilter, setVramFilter] = useState<number | 'all'>('all')
  const [gddrFilter, setGddrFilter] = useState<string | 'all'>('all')
  const [caseFilter, setCaseFilter] = useState<CaseFilter | 'all'>('all')
  const [priceSort, setPriceSort] = useState<'asc' | 'desc'>('asc')
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDeferred(query.trim()), 350)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setQuery('')
    setDeferred('')
    setPage(1)
    setBrand('all')
    setDriveFilter('all')
    setGenFilter('all')
    setSizeFilter('all')
    setCertFilter('all')
    setCoreFilter('all')
    setVramFilter('all')
    setGddrFilter('all')
    setCaseFilter('all')
    setPriceSort('asc')
  }, [step])

  const bySlug = useMemo(() => new Map(items.map((item) => [item.slug, item])), [items])
  const cpu = bySlug.get(selection.cpu ?? '') ?? null
  const gpu = bySlug.get(selection.gpu ?? '') ?? null
  const resolved = useMemo(
    () => ({
      cpu,
      gpu,
      motherboard: bySlug.get(selection.motherboard ?? '') ?? null,
      ram: bySlug.get(selection.ram ?? '') ?? null,
      psu: bySlug.get(selection.psu ?? '') ?? null,
      case: bySlug.get(selection.case ?? '') ?? null,
      storage: bySlug.get(selection.storage ?? '') ?? null,
      cooler: bySlug.get(selection.cooler ?? '') ?? null,
    }),
    [bySlug, cpu, gpu, selection],
  )
  const broken = useMemo(() => invalidatedSlots(resolved, context), [resolved, context])

  const brandQuery = (step === 'cpu' || step === 'gpu') && brand !== 'all'
    ? brand === 'amd' ? (step === 'gpu' ? 'radeon' : 'ryzen') : brand === 'nvidia' ? 'geforce' : 'intel'
    : ''
  const caseQuery = caseFilter === 'all' ? '' : CASE_CHIPS.find((chip) => chip.id === caseFilter)?.query ?? ''
  const filterQuery = [
    brandQuery,
    step === 'cpu' && coreFilter !== 'all' ? `${coreFilter} nucleos` : '',
    step === 'gpu' && vramFilter !== 'all' ? `${vramFilter}GB` : '',
    step === 'gpu' && gddrFilter !== 'all' ? gddrFilter : '',
    step === 'case' ? caseQuery : '',
  ].filter(Boolean).join(' ')
  const cpuSocket = cpuSocketOf(cpu, cpuOffer?.name ?? null)
  const allowedRam = ramGensOf(cpu, cpuSocket)
  const platformStep = step === 'motherboard' || step === 'ram' || step === 'cooler'
  const platformMissing = Boolean(cpuOffer) && (
    ((step === 'motherboard' || step === 'cooler') && !cpuSocket) ||
    (step === 'ram' && allowedRam.length === 0)
  )
  const hints = platformMissing
    ? []
    : marketHints(step, cpuSocket, allowedRam, offers.motherboard?.name ?? null, deferred).map((hint) => [hint, filterQuery].filter(Boolean).join(' '))
  const marketResults = useQueries({
    queries: hints.map((hint) => ({
      queryKey: ['market', step, hint, page],
      queryFn: () => fetchMarket(step as MarketCategory, hint, page),
      enabled: !finished,
      staleTime: 5 * 60 * 1000,
    })),
  })
  const marketOffers = useMemo(() => {
    const seen = new Set<string>()
    return marketResults.flatMap((result) => result.data?.offers ?? []).filter((offer) => {
      if (seen.has(offer.id)) return false
      seen.add(offer.id)
      return true
    })
  }, [marketResults])
  const marketLoading = marketResults.some((result) => result.isLoading)
  const marketError = marketResults.length > 0 && marketResults.every((result) => result.isError)
  const nextPage = marketResults.map((result) => result.data?.nextPage).find((value) => value != null) ?? null
  const loadWatts = cpuLoadWatts(cpu)
  const slots = motherSlots(offers.motherboard?.name ?? null)
  const usedSlots = ramLines.reduce((sum, line) => sum + line.modules, 0)

  const fitContext: FitContext = {
    cpu,
    cpuSocket,
    allowedRam,
    motherName: offers.motherboard?.name ?? null,
    caseName: offers.case?.name ?? null,
    recommendedWatts: analysis.power.recommendedPsuWatts,
  }

  const constrained = onlyCompatible && platformStep && !platformMissing
  const offerCards = marketOffers
    .map((offer) => {
      const fit = offerFit(offer, step, fitContext)
      if (step !== 'cooler' || loadWatts <= 0) return { offer, ...fit, recommended: false }
      const dissipation = coolerWatts(offer.name)
      if (dissipation == null) return { offer, status: fit.status, note: [fit.note, 'El título no dice la disipación.'].filter(Boolean).join(' '), recommended: false }
      if (dissipation >= loadWatts) return { offer, status: 'compatible' as const, note: `Recomendado para este procesador (${loadWatts} W en carga).`, recommended: true }
      return { offer, status: fit.status === 'incompatible' ? fit.status : 'unknown' as const, note: `Le faltan ${loadWatts - dissipation} W para los ${loadWatts} W en carga.`, recommended: false }
    })
    .filter((card) => {
      if ((step === 'cpu' || step === 'gpu') && brand !== 'all' && offerBrand(card.offer.name) !== brand) return false
      if (step === 'cpu' && coreFilter !== 'all' && coreCount(card.offer.name) !== coreFilter) return false
      if (step === 'gpu' && vramFilter !== 'all' && capacityGb(card.offer.name) !== vramFilter) return false
      if (step === 'gpu' && gddrFilter !== 'all' && videoMemory(card.offer.name) !== gddrFilter) return false
      if (step === 'case' && caseFilter !== 'all' && !matchesCase(card.offer.name, caseFilter)) return false
      if (step === 'storage') {
        const kind = driveKind(card.offer.name)
        const gen = nvmeGen(card.offer.name)
        if (driveFilter === 'hdd' && kind !== 'hdd') return false
        if (driveFilter === 'ssd25' && kind !== 'ssd25') return false
        if (driveFilter === 'm2' && kind !== 'm2') return false
        if (genFilter !== 'all' && (kind !== 'm2' || gen !== genFilter)) return false
      }
      if ((step === 'storage' || step === 'ram') && sizeFilter !== 'all' && capacityGb(card.offer.name) !== sizeFilter) return false
      if (step === 'psu' && certFilter !== 'all' && psuCert(card.offer.name) !== certFilter) return false
      if (onlyCompatible && card.status === 'incompatible') return false
      if (constrained && card.status !== 'compatible') return false
      return true
    })
    .sort((a, b) => {
      const stock = Number(a.offer.available === false) - Number(b.offer.available === false)
      if (stock !== 0) return stock
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1
      const rank = (status: Fit) => (status === 'compatible' ? 0 : status === 'unknown' ? 1 : 2)
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status)
      const price = a.offer.priceArs - b.offer.priceArs
      return priceSort === 'asc' ? price : -price
    })
  const inStock = offerCards.some((card) => card.offer.available !== false)
  const stockAlert = constrained && !marketLoading && !inStock

  const advance = () => setStep(Math.min(stepIndex + 1, BUILDER_STEPS.length - 1))
  const pickOffer = (offer: MarketOffer) => {
    if (offer.available === false) return
    if (step === 'cpu') {
      setCpuOffer(offer, matchCatalogCpu(items, offer.name)?.slug ?? null)
      advance()
      return
    }
    if (step === 'storage') {
      addDrive(offer)
      return
    }
    if (step === 'ram') {
      const modules = ramModules(offer.name)
      if (usedSlots + modules > slots) return
      addRam({ offer, modules })
      return
    }
    if (step === 'cooler') {
      setStockCooler(false)
      setOffer('cooler', offer)
      return
    }
    if (step === 'gpu') {
      setGpuOffer(offer, matchCatalogGpu(items, offer.name)?.slug ?? null)
      advance()
      return
    }
    if (!isMarket(step)) return
    setOffer(step, offer)
    advance()
  }
  const sizes = [...new Set(marketOffers.map((offer) => capacityGb(offer.name)).filter((value): value is number => value != null))].sort((a, b) => a - b)
  const singleOffers = BUILDER_STEPS.filter((key): key is MarketSlot => isMarket(key) && key !== 'storage' && key !== 'ram' && key !== 'cooler')
  const total = (cpuOffer?.priceArs ?? 0)
    + (useIgpu ? 0 : gpuOffer?.priceArs ?? 0)
    + drives.reduce((sum, offer) => sum + offer.priceArs, 0)
    + ramLines.reduce((sum, line) => sum + line.offer.priceArs, 0)
    + (stockCooler ? 0 : offers.cooler?.priceArs ?? 0)
    + singleOffers.reduce((sum, key) => sum + (offers[key]?.priceArs ?? 0), 0)
  const receipt: ReceiptLine[] = []
  if (cpuOffer) receipt.push(receiptLine('cpu', cpuOffer, traitsOf('cpu', cpuOffer.name, cpu)))
  if (offers.motherboard) receipt.push(receiptLine('motherboard', offers.motherboard, traitsOf('motherboard', offers.motherboard.name, cpu)))
  for (const line of ramLines) {
    const modules = `${line.modules} slot${line.modules > 1 ? 's' : ''}`
    const detail = [traitsOf('ram', line.offer.name, cpu), modules].filter(Boolean).join(' · ')
    receipt.push(receiptLine(line.lineId, line.offer, detail))
  }
  if (useIgpu) receipt.push({ key: 'igpu', name: cpu?.cpu?.integratedGraphics ? `Gráfica integrada · ${cpu.cpu.integratedGraphics}` : 'Gráfica integrada', price: 0, store: null, url: null, imageUrl: null, detail: 'No suma una placa' })
  if (gpuOffer) receipt.push(receiptLine('gpu', gpuOffer, traitsOf('gpu', gpuOffer.name, cpu)))
  for (const drive of drives) receipt.push(receiptLine(`drive-${drive.id}`, drive, traitsOf('storage', drive.name, cpu)))
  if (offers.psu) receipt.push(receiptLine('psu', offers.psu, traitsOf('psu', offers.psu.name, cpu)))
  if (offers.case) receipt.push(receiptLine('case', offers.case, traitsOf('case', offers.case.name, cpu)))
  if (stockCooler) receipt.push({ key: 'stock-cooler', name: 'Disipador incluido', price: 0, store: null, url: null, imageUrl: null, detail: 'Viene con el procesador' })
  if (offers.cooler) receipt.push(receiptLine('cooler', offers.cooler, traitsOf('cooler', offers.cooler.name, cpu)))
  if (offers.monitor) receipt.push(receiptLine('monitor', offers.monitor, ''))
  if (offers.peripheral) receipt.push(receiptLine('peripheral', offers.peripheral, ''))

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-7">
        {finished ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white">Resumen del armado</h2>
              <p className="mt-1 text-sm text-slate-400">Lo que elegiste, con la tienda y lo que se lee del título.</p>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <p className={`inline-block rounded border px-2 py-1 text-[11px] font-black ${tierClass(analysis.tiers.globalTier)}`}>Tier del armado {analysis.tiers.globalTier}</p>
              <p className="text-right">
                <span className="block text-[10px] uppercase tracking-widest text-slate-500">{analysis.power.recommendedPsuWatts} W recomendados</span>
                <span className="text-lg font-black text-white">Total {formatArs(total)}</span>
              </p>
            </div>
            {receipt.length === 0 ? (
              <p className="text-sm text-slate-400">Todavía no elegiste piezas.</p>
            ) : (
              <ul className="space-y-3">
                {receipt.map((line) => (
                  <li key={line.key} className="flex items-center gap-3 rounded-2xl border border-slate-800 p-3">
                    {line.imageUrl ? (
                      <img src={line.imageUrl} alt="" className="h-16 w-24 shrink-0 object-contain" />
                    ) : (
                      <span className="h-16 w-24 shrink-0 rounded bg-slate-900" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-white">{line.name}</span>
                      {line.detail && <span className="mt-1 block text-[11px] text-slate-400">{line.detail}</span>}
                      {line.url && line.store && <a href={line.url} target="_blank" rel="noreferrer" className="mt-1 block text-[11px] font-bold text-cyan-300 underline">Ver en {line.store}</a>}
                    </span>
                    <span className="shrink-0 text-sm font-black text-white">{formatArs(line.price)}</span>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={() => setFinished(false)} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-black uppercase text-slate-200">
              Volver al armado
            </button>
          </section>
        ) : (
        <>
        <div>
          <h2 className="text-2xl font-black text-white">{COPY[step].title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{COPY[step].help}</p>
        </div>
        {broken.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            <span>Estas piezas del catálogo quedaron incompatibles: {broken.join(', ')}.</span>
            <button type="button" onClick={() => clearFrom(broken[0])} className="rounded bg-rose-500 px-2 py-1 font-black text-slate-950">Quitar desde ahí</button>
          </div>
        )}
        <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1) }}
            placeholder={step === 'peripheral' ? 'Teclado, mouse, auriculares…' : 'Buscar'}
            aria-label="Buscar en este paso"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          />
          <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <input type="checkbox" checked={onlyCompatible} onChange={(event) => setOnlyCompatible(event.target.checked)} />
            Solo compatibles
          </label>
        </div>
        {step === 'gpu' && cpu?.cpu?.integratedGraphics && (
          <button type="button" onClick={() => { setUseIgpu(true); advance() }} className="w-full rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-left">
            <span className="block text-sm font-black text-white">Usar la gráfica integrada</span>
            <span className="text-xs text-emerald-200">{cpu.cpu.integratedGraphics}. No suma una placa al total.</span>
          </button>
        )}
        {step === 'gpu' && cpu && !cpu.cpu?.integratedGraphics && (
          <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">Este procesador no tiene gráficos integrados. Hace falta una placa.</p>
        )}
        {step === 'cooler' && includesStockCooler(cpu) && (
          <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            <p>Este procesador trae cooler. Podés usarlo, saltar el paso o agregar otro.</p>
            <button type="button" onClick={() => { setStockCooler(true); advance() }} className="mt-2 rounded-xl bg-white px-3 py-1.5 text-xs font-black uppercase text-slate-950">Usar el incluido</button>
          </div>
        )}
        {step === 'cooler' && cpu && !includesStockCooler(cpu) && (
          <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">Este procesador no trae disipador. Podés comprar uno o saltar el paso.</p>
        )}
        {step === 'ram' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Slots usados: {usedSlots} de {slots}. Podés repetir el mismo módulo. Un kit 2x ocupa dos.</p>
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button key={size} type="button" onClick={() => setSizeFilter(sizeFilter === size ? 'all' : size)} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${sizeFilter === size ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                    {size >= 1024 ? `${size / 1024} TB` : `${size} GB`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {step === 'storage' && (
          <div className="flex flex-wrap gap-2">
            {(['all', 'hdd', 'ssd25', 'm2'] as const).map((id) => (
              <button key={id} type="button" onClick={() => setDriveFilter(id)} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${driveFilter === id ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                {id === 'all' ? 'Todos' : id === 'hdd' ? 'HDD' : id === 'ssd25' ? 'SSD 2.5' : 'M.2'}
              </button>
            ))}
            {([1, 2, 3, 4, 5] as const).map((gen) => (
              <button key={gen} type="button" onClick={() => setGenFilter(genFilter === gen ? 'all' : gen)} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${genFilter === gen ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                Gen{gen}
              </button>
            ))}
            {sizes.map((size) => (
              <button key={size} type="button" onClick={() => setSizeFilter(sizeFilter === size ? 'all' : size)} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${sizeFilter === size ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                {size >= 1024 ? `${size / 1024} TB` : `${size} GB`}
              </button>
            ))}
          </div>
        )}
        {step === 'psu' && (
          <div className="flex flex-wrap gap-2">
            {(['all', 'white', 'bronze', 'silver', 'gold', 'platinum', 'titanium'] as const).map((id) => (
              <button key={id} type="button" onClick={() => setCertFilter(id)} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${certFilter === id ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                {id === 'all' ? 'Todas' : id === 'white' ? '80 Plus' : id}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPriceSort('asc')} className={chipClass(priceSort === 'asc')}>Menor precio</button>
          <button type="button" onClick={() => setPriceSort('desc')} className={chipClass(priceSort === 'desc')}>Mayor precio</button>
        </div>
        {(step === 'cpu' || step === 'gpu') && (
          <div className="flex flex-wrap gap-2">
            {(step === 'cpu' ? ['all', 'amd', 'intel'] : ['all', 'nvidia', 'amd', 'intel']).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => { setBrand(id as 'all' | 'nvidia' | 'amd' | 'intel'); setPage(1) }}
                className={chipClass(brand === id)}
              >
                {id === 'all' ? 'Todas' : id}
              </button>
            ))}
          </div>
        )}
        {step === 'cpu' && (
          <div className="flex flex-wrap gap-2">
            {CORE_COUNTS.map((count) => (
              <button key={count} type="button" onClick={() => { setCoreFilter(coreFilter === count ? 'all' : count); setPage(1) }} className={chipClass(coreFilter === count)}>
                {count} núcleos
              </button>
            ))}
          </div>
        )}
        {step === 'gpu' && (
          <div className="flex flex-wrap gap-2">
            {VRAM_SIZES.map((size) => (
              <button key={size} type="button" onClick={() => { setVramFilter(vramFilter === size ? 'all' : size); setPage(1) }} className={chipClass(vramFilter === size)}>
                {size} GB
              </button>
            ))}
            {GDDR_TYPES.map((kind) => (
              <button key={kind} type="button" onClick={() => { setGddrFilter(gddrFilter === kind ? 'all' : kind); setPage(1) }} className={chipClass(gddrFilter === kind)}>
                {kind}
              </button>
            ))}
          </div>
        )}
        {step === 'case' && (
          <div className="flex flex-wrap gap-2">
            {CASE_CHIPS.map((chip) => (
              <button key={chip.id} type="button" onClick={() => { setCaseFilter(caseFilter === chip.id ? 'all' : chip.id); setPage(1) }} className={chipClass(caseFilter === chip.id)}>
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {step === 'psu' && analysis.power.recommendedPsuWatts > 0 && (
          <p className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            Para este armado se sugiere una fuente de al menos {analysis.power.recommendedPsuWatts} W.
          </p>
        )}
        {cpuOffer && cpuSocket && platformStep && (
          <p className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            Para este procesador: {cpuSocket}{allowedRam.length > 0 ? ` · ${allowedRam.map((gen) => gen.toUpperCase()).join(' / ')}` : ''}.
          </p>
        )}
        {platformMissing && (
          <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
            No se pudo identificar el socket de este procesador. No se listan piezas de otra plataforma.
          </p>
        )}
        {marketLoading && <p className="text-sm text-slate-400">Buscando ofertas en las tiendas…</p>}
        {marketError && (
          <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">No se pudieron leer las ofertas de HardGamers.</p>
        )}
        {stockAlert && (
          <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
            Ya no hay stock de {step === 'motherboard' ? 'mothers' : step === 'cooler' ? 'coolers' : 'memoria'} compatibles con este procesador.
          </p>
        )}
        {!platformMissing && !marketLoading && !marketError && !stockAlert && offerCards.length === 0 && (
          <p className="text-sm text-slate-400">No hay ofertas con ese criterio.</p>
        )}

        <ul className="grid max-h-[680px] gap-3 overflow-y-auto pr-1 custom-scrollbar">
          {offerCards.map((card) => {
            const active = step === 'cpu'
              ? cpuOffer?.id === card.offer.id
              : step === 'gpu'
                ? gpuOffer?.id === card.offer.id
                : step === 'storage'
                  ? drives.some((item) => item.id === card.offer.id)
                  : step === 'ram'
                    ? ramLines.some((line) => line.offer.id === card.offer.id)
                    : isMarket(step) && offers[step]?.id === card.offer.id
            const blocked = card.status === 'incompatible' || card.offer.available === false
            return (
              <li key={card.offer.id} className={`flex items-stretch gap-2 rounded-2xl border p-3 ${active ? 'border-cyan-400' : 'border-slate-800'}`}>
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => pickOffer(card.offer)}
                  className={`flex min-w-0 flex-1 items-center gap-3 text-left ${blocked ? 'opacity-40' : ''} ${active ? 'text-cyan-100' : ''}`}
                >
                  {card.offer.imageUrl ? (
                    <img src={card.offer.imageUrl} alt="" className="h-16 w-24 shrink-0 object-contain" />
                  ) : (
                    <span className="h-16 w-24 shrink-0 rounded bg-slate-900" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-white">{card.offer.name}</span>
                    <span className="mt-1 block text-sm font-black text-white">{formatArs(card.offer.priceArs)}</span>
                    <span className="block text-[11px] text-slate-400">{card.offer.store}</span>
                    <span className={`block text-[11px] font-bold ${card.offer.available === false ? 'text-amber-300' : fitClass(card.status)}`}>
                      {card.offer.available === false ? 'Sin stock' : fitLabel(card.status)}{card.note ? ` · ${card.note}` : ''}
                    </span>
                  </span>
                </button>
                <a href={card.offer.url} target="_blank" rel="noreferrer" className="self-center whitespace-nowrap text-[11px] font-bold text-cyan-300 underline">
                  Ver en {card.offer.store}
                </a>
              </li>
            )
          })}
        </ul>
        {nextPage != null && (
          <button type="button" onClick={() => setPage(nextPage)} className="text-xs font-bold text-cyan-300">
            Más ofertas
          </button>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={stepIndex === 0} onClick={() => setStep(stepIndex - 1)} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-black uppercase text-slate-200 disabled:opacity-40">
            Volver atrás
          </button>
          <button type="button" disabled={stepIndex >= BUILDER_STEPS.length - 1} onClick={advance} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-black uppercase text-slate-200 disabled:opacity-40">
            {step === 'storage' || step === 'ram' || step === 'cooler' ? 'Seguir' : 'Saltear paso'}
          </button>
          <button type="button" onClick={() => setFinished(true)} className="rounded-xl bg-white px-3 py-2 text-xs font-black uppercase text-slate-950">
            Finalizar
          </button>
        </div>
        </>
        )}
      </div>

      <aside className="space-y-4 lg:col-span-5">
        <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Componentes</h2>
              <p className={`mt-2 inline-block rounded border px-2 py-1 text-[11px] font-black ${tierClass(analysis.tiers.globalTier)}`}>Tier del armado {analysis.tiers.globalTier}</p>
              {analysis.tiers.penalties.slice(0, 2).map((line) => <p key={line} className="mt-1 text-[11px] text-amber-200">{line}</p>)}
            </div>
            <p className="text-right text-sm text-slate-300">
              <span className="block text-[10px] uppercase tracking-widest text-slate-500">{analysis.power.recommendedPsuWatts} W recomendados</span>
              <span className="text-lg font-black text-white">Total {formatArs(total)}</span>
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {BUILDER_STEPS.map((key, index) => {
              const chosen = key === 'cpu'
                ? cpuOffer?.name ?? cpu?.name
                : key === 'gpu'
                  ? (useIgpu ? cpu?.cpu?.integratedGraphics ?? 'Integrada' : gpuOffer?.name ?? gpu?.name)
                  : key === 'storage'
                    ? (drives.length > 0 ? `${drives.length} disco${drives.length > 1 ? 's' : ''}` : null)
                    : key === 'ram'
                      ? (usedSlots > 0 ? `${usedSlots} de ${slots} slots` : null)
                      : key === 'cooler'
                        ? (stockCooler ? 'Incluido' : offers.cooler?.name)
                        : isMarket(key) ? offers[key]?.name : null
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setFinished(false); setStep(index) }}
                  className={`flex items-center gap-2 rounded-2xl border px-2 py-2 text-left ${index === stepIndex ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-800'}`}
                >
                  <SlotIcon step={key} className="h-8 w-8 shrink-0 text-slate-300" />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">{SLOT_LABEL[key]}</span>
                    <span className="block truncate text-[11px] text-slate-200">{chosen ?? 'Elegir'}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <ul className="mt-4 space-y-2 text-xs">
            {cpuOffer && (
              <li className="flex items-start justify-between gap-3 border-t border-white/10 pt-2">
                <span>
                  <span className="block font-bold text-white">{cpuOffer.name}</span>
                  <a href={cpuOffer.url} target="_blank" rel="noreferrer" className="text-cyan-300 underline">Ver en {cpuOffer.store}</a>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-black text-white">{formatArs(cpuOffer.priceArs)}</span>
                  <button type="button" onClick={() => setCpuOffer(null, null)} className="text-[10px] font-bold text-slate-500">Quitar</button>
                </span>
              </li>
            )}
            {useIgpu && (
              <li className="flex items-start justify-between gap-3 border-t border-white/10 pt-2">
                <span className="font-bold text-white">Gráfica integrada · {cpu?.cpu?.integratedGraphics}</span>
                <button type="button" onClick={() => setUseIgpu(false)} className="text-[10px] font-bold text-slate-500">Quitar</button>
              </li>
            )}
            {gpuOffer && (
              <li className="flex items-start justify-between gap-3 border-t border-white/10 pt-2">
                <span>
                  <span className="block font-bold text-white">{gpuOffer.name}</span>
                  <a href={gpuOffer.url} target="_blank" rel="noreferrer" className="text-cyan-300 underline">Ver en {gpuOffer.store}</a>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-black text-white">{formatArs(gpuOffer.priceArs)}</span>
                  <button type="button" onClick={() => setGpuOffer(null, null)} className="text-[10px] font-bold text-slate-500">Quitar</button>
                </span>
              </li>
            )}
            {drives.map((offer) => (
              <li key={offer.id} className="flex items-start justify-between gap-3 border-t border-white/10 pt-2">
                <span>
                  <span className="block font-bold text-white">{offer.name}</span>
                  <a href={offer.url} target="_blank" rel="noreferrer" className="text-cyan-300 underline">Ver en {offer.store}</a>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-black text-white">{formatArs(offer.priceArs)}</span>
                  <button type="button" onClick={() => removeDrive(offer.id)} className="text-[10px] font-bold text-slate-500">Quitar</button>
                </span>
              </li>
            ))}
            {ramLines.map((line) => (
              <li key={line.lineId} className="flex items-start justify-between gap-3 border-t border-white/10 pt-2">
                <span>
                  <span className="block font-bold text-white">{line.offer.name}</span>
                  <span className="text-slate-500">{line.modules} slot{line.modules > 1 ? 's' : ''}</span>
                  <a href={line.offer.url} target="_blank" rel="noreferrer" className="block text-cyan-300 underline">Ver en {line.offer.store}</a>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-black text-white">{formatArs(line.offer.priceArs)}</span>
                  <button type="button" onClick={() => removeRam(line.lineId)} className="text-[10px] font-bold text-slate-500">Quitar</button>
                </span>
              </li>
            ))}
            {stockCooler && (
              <li className="flex items-start justify-between gap-3 border-t border-white/10 pt-2">
                <span className="font-bold text-white">Disipador incluido</span>
                <span className="text-right">
                  <span className="block font-black text-white">{formatArs(0)}</span>
                  <button type="button" onClick={() => setStockCooler(false)} className="text-[10px] font-bold text-slate-500">Quitar</button>
                </span>
              </li>
            )}
            {offers.cooler && (
              <li className="flex items-start justify-between gap-3 border-t border-white/10 pt-2">
                <span>
                  <span className="block font-bold text-white">{offers.cooler.name}</span>
                  <a href={offers.cooler.url} target="_blank" rel="noreferrer" className="text-cyan-300 underline">Ver en {offers.cooler.store}</a>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-black text-white">{formatArs(offers.cooler.priceArs)}</span>
                  <button type="button" onClick={() => setOffer('cooler', null)} className="text-[10px] font-bold text-slate-500">Quitar</button>
                </span>
              </li>
            )}
            {singleOffers.map((key) => offers[key] && (
              <li key={key} className="flex items-start justify-between gap-3 border-t border-white/10 pt-2">
                <span>
                  <span className="block font-bold text-white">{offers[key]!.name}</span>
                  <a href={offers[key]!.url} target="_blank" rel="noreferrer" className="text-cyan-300 underline">Ver en {offers[key]!.store}</a>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-black text-white">{formatArs(offers[key]!.priceArs)}</span>
                  <button type="button" onClick={() => setOffer(key, null)} className="text-[10px] font-bold text-slate-500">Quitar</button>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-slate-500">
            Los precios salen del comparador <a className="underline" href="https://www.hardgamers.com.ar/" target="_blank" rel="noreferrer">HardGamers</a>. “Ver en …” abre el producto en la tienda nombrada.
          </p>
        </section>
        <details className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <summary className="cursor-pointer text-xs font-black uppercase tracking-widest text-slate-400">Detalle técnico</summary>
          <div className="mt-4 space-y-4">
            <IssuePanel analysis={analysis} />
            <PowerCurve analysis={analysis} />
            <BottleneckHeatmap analysis={analysis} />
            <UpgradeList analysis={analysis} />
          </div>
        </details>
      </aside>
    </div>
  )
}
