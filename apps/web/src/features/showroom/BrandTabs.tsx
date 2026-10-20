import type { KeyboardEvent } from 'react'
import { BrandLogo } from '../../components/BrandLogo'
import { seriesLogo } from '../../lib/brands'
import type { BrandId, FamilyId } from '../../nav'

const FAMILIES: { id: FamilyId; label: string }[] = [
  { id: 'gpu', label: 'GPU' },
  { id: 'cpu', label: 'CPU' },
]

const BRANDS: { id: BrandId; label: string }[] = [
  { id: 'nvidia', label: 'NVIDIA' },
  { id: 'amd', label: 'AMD' },
  { id: 'intel', label: 'Intel' },
]

export function BrandTabs({
  family,
  brand,
  onFamily,
  onBrand,
}: {
  family: FamilyId
  brand: BrandId
  onFamily: (family: FamilyId) => void
  onBrand: (brand: BrandId) => void
}) {
  const moveBrand = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const enabled = BRANDS.filter((item) => !(family === 'cpu' && item.id === 'nvidia'))
    const index = enabled.findIndex((item) => item.id === brand)
    const step = event.key === 'ArrowRight' ? 1 : -1
    const next = enabled[(index + step + enabled.length) % enabled.length]
    if (next) onBrand(next.id)
    event.preventDefault()
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div role="tablist" aria-label="Familia" className="flex w-fit rounded-full bg-slate-950/80 p-1">
        {FAMILIES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={family === item.id}
            onClick={() => onFamily(item.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-black tracking-widest ${family === item.id ? 'bg-white text-slate-950' : 'text-slate-300'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tablist" aria-label="Marca" className="flex gap-2" onKeyDown={moveBrand}>
        {BRANDS.map((item) => {
          const disabled = family === 'cpu' && item.id === 'nvidia'
          const active = brand === item.id
          const logo = seriesLogo(family, item.id)
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              title={disabled ? 'NVIDIA no fabrica CPU de escritorio' : item.label}
              onClick={() => onBrand(item.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black tracking-wide ${active ? '' : 'border-white/15 text-white'} ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
              style={active ? { background: 'var(--brand)', borderColor: 'var(--brand)', color: 'var(--brand-ink)' } : undefined}
            >
              {logo && <BrandLogo src={logo} alt="" className="h-6 w-10" />}
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
