import { TIER_VALUE, type CatalogItem, type ComponentType, type Tier } from '@pc/shared'
import { useEffect, useMemo, useState } from 'react'
import { ComponentImage } from '../../components/ComponentImage'
import { BenchmarkSources } from '../../components/BenchmarkSources'
import { SearchSelect } from '../../components/SearchSelect'
import { formatBus, formatConnectors } from '../../lib/format'
import { useNavStore } from '../../nav'

interface Row {
  label: string
  left: string
  right: string
  leftNum: number | null
  rightNum: number | null
  higherBetter: boolean
}

function textRow(label: string, left: string, right: string): Row {
  return { label, left, right, leftNum: null, rightNum: null, higherBetter: true }
}

function valueRow(label: string, left: number | null, right: number | null, suffix = '', higherBetter = true): Row {
  const show = (value: number | null) => (value == null ? '—' : `${value}${suffix}`)
  return { label, left: show(left), right: show(right), leftNum: left, rightNum: right, higherBetter }
}

function lines(item: CatalogItem, tier: Tier): Row[] {
  const rows: Row[] = [
    valueRow('Año', item.releaseYear, null),
    { label: 'Tier', left: tier, right: '', leftNum: TIER_VALUE[tier], rightNum: null, higherBetter: true },
    valueRow('Índice', item.performanceScore, null),
    valueRow('TDP', item.tdpWatts, null, ' W', false),
    valueRow('Precio', item.priceUsd, null, ' USD', false),
  ]
  if (item.gpu) {
    rows.push(
      textRow('Arquitectura', item.gpu.architecture, ''),
      textRow('Bus', formatBus(item.gpu.busInterface), ''),
      valueRow('Carriles', item.gpu.busLanes, null),
      valueRow('VRAM', item.gpu.vramMb, null, ' MB'),
      textRow('Tipo de VRAM', item.gpu.vramType ?? 'no catalogada', ''),
      valueRow('Bus de memoria', item.gpu.memoryBusWidthBits, null, ' bit'),
      valueRow('Shaders', item.gpu.shaderCores, null),
      valueRow('Largo', item.gpu.lengthMm, null, ' mm', false),
      textRow('Conectores', formatConnectors(item.gpu.powerConnectors), ''),
    )
    if (item.benchmarks) {
      rows.push(
        valueRow('Raster 1080p', item.benchmarks.raster.p1080, null, ' FPS'),
        valueRow('Raster 1440p', item.benchmarks.raster.p1440, null, ' FPS'),
        valueRow('Raster 4K', item.benchmarks.raster.p2160, null, ' FPS'),
        valueRow('RT 1080p', item.benchmarks.rt.p1080, null, ' FPS'),
        valueRow('RT 1440p', item.benchmarks.rt.p1440, null, ' FPS'),
        valueRow('RT 4K', item.benchmarks.rt.p2160, null, ' FPS'),
      )
    }
  }
  if (item.cpu) {
    rows.push(
      textRow('Arquitectura', item.cpu.architecture, ''),
      textRow('Socket', item.cpu.socketName, ''),
      valueRow('Núcleos', item.cpu.cores, null),
      valueRow('Hilos', item.cpu.threads, null),
      valueRow('Boost', item.cpu.boostClockMhz, null, ' MHz'),
      valueRow('L3', item.cpu.l3CacheKb, null, ' KB'),
      textRow('RAM máxima', item.cpu.maxRamGen.toUpperCase(), ''),
      valueRow('Pico', item.cpu.peakTransientTdpWatts, null, ' W', false),
    )
  }
  return rows
}

function merge(left: Row[], right: Row[]): Row[] {
  const byLabel = new Map(right.map((row) => [row.label, row]))
  return left.map((row) => {
    const other = byLabel.get(row.label)
    return {
      ...row,
      right: other?.left ?? '—',
      rightNum: other?.leftNum ?? null,
    }
  })
}

function Side({ value, amount, max, win }: { value: string; amount: number | null; max: number | null; win: 'yes' | 'no' | 'tie' | 'na' }) {
  const tone = win === 'yes' ? 'text-emerald-300' : win === 'no' ? 'text-rose-300' : 'text-white'
  const width = amount != null && max != null && max > 0 ? Math.max(8, Math.min(100, (amount / max) * 100)) : 0
  return (
    <td className={`px-4 py-2 font-medium ${tone}`}>
      {value}
      {win !== 'na' && amount != null && max != null && max > 0 && (
        <span className="mt-1 block h-1 overflow-hidden rounded bg-slate-800">
          <span className={`block h-full ${win === 'no' ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${width}%` }} />
        </span>
      )}
    </td>
  )
}

export function ComparePage({ items, ranks }: { items: CatalogItem[]; ranks: Map<string, Tier> }) {
  const compareA = useNavStore((state) => state.compareA)
  const compareB = useNavStore((state) => state.compareB)
  const setCompare = useNavStore((state) => state.setCompare)
  const [type, setType] = useState<ComponentType>('gpu')
  const pool = useMemo(() => items.filter((item) => item.type === type), [items, type])
  const [left, setLeft] = useState(pool.find((item) => item.slug === 'g_4090')?.slug ?? pool[0]?.slug ?? '')
  const [right, setRight] = useState(pool.find((item) => item.slug === 'g_7900xtx')?.slug ?? pool[1]?.slug ?? pool[0]?.slug ?? '')

  useEffect(() => {
    if (!compareA) return
    const chosen = items.find((item) => item.slug === compareA)
    if (!chosen) return
    setType(chosen.type)
    setLeft(compareA)
    if (compareB) setRight(compareB)
  }, [compareA, compareB, items])

  const a = pool.find((item) => item.slug === left) ?? pool[0]
  const b = pool.find((item) => item.slug === right) ?? pool[1] ?? pool[0]
  if (!a || !b) return <p className="text-slate-400">No hay piezas de este tipo.</p>
  const rows = merge(lines(a, ranks.get(a.slug) ?? a.baseTier), lines(b, ranks.get(b.slug) ?? b.baseTier))

  const pick = (side: 'left' | 'right', slug: string) => {
    const nextLeft = side === 'left' ? slug : a.slug
    const nextRight = side === 'right' ? slug : b.slug
    if (side === 'left') setLeft(slug)
    else setRight(slug)
    setCompare(nextLeft, nextRight)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Tipo
          <select
            value={type}
            onChange={(event) => {
              const next = event.target.value as ComponentType
              const nextPool = items.filter((item) => item.type === next)
              const nextLeft = nextPool[0]?.slug ?? ''
              const nextRight = nextPool[1]?.slug ?? nextLeft
              setType(next)
              setLeft(nextLeft)
              setRight(nextRight)
              if (nextLeft) setCompare(nextLeft, nextRight)
            }}
            className="mt-1 block rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-white"
          >
            {['gpu', 'cpu', 'motherboard', 'ram', 'psu', 'cooler', 'storage', 'case'].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <SearchSelect label="Pieza A" items={pool} value={a.slug} onChange={(slug) => pick('left', slug)} />
        <SearchSelect label="Pieza B" items={pool} value={b.slug} onChange={(slug) => pick('right', slug)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ComponentImage item={a} priority className="h-40 w-full" />
        <ComponentImage item={b} priority className="h-40 w-full" />
      </div>
      <div className="glass-panel min-w-0 overflow-x-auto rounded-2xl custom-scrollbar">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3">Spec</th>
              <th className="px-4 py-3">{a.name}</th>
              <th className="px-4 py-3">{b.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const comparable = row.leftNum != null && row.rightNum != null
              const leftWins = comparable && (row.higherBetter ? row.leftNum! > row.rightNum! : row.leftNum! < row.rightNum!)
              const rightWins = comparable && (row.higherBetter ? row.rightNum! > row.leftNum! : row.rightNum! < row.leftNum!)
              const tie = comparable && row.leftNum === row.rightNum
              const max = comparable ? Math.max(row.leftNum!, row.rightNum!) : null
              const leftMark = !comparable ? 'na' : tie ? 'tie' : leftWins ? 'yes' : 'no'
              const rightMark = !comparable ? 'na' : tie ? 'tie' : rightWins ? 'yes' : 'no'
              return (
                <tr key={row.label} className="border-t border-slate-800">
                  <td className="px-4 py-2 text-slate-500">{row.label}</td>
                  <Side value={row.left} amount={row.leftNum} max={max} win={leftMark} />
                  <Side value={row.right} amount={row.rightNum} max={max} win={rightMark} />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {(a.type === 'gpu' || b.type === 'gpu') && <BenchmarkSources source={a.benchmarks?.source ?? b.benchmarks?.source} />}
    </div>
  )
}
