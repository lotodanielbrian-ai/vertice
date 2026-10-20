import { isConceptual, type CatalogItem, type Tier } from '@pc/shared'
import { ComponentImage } from '../../components/ComponentImage'
import { specHighlights, tierClass } from '../../lib/format'

export function ProductCard({
  item,
  eraTier,
  rankTier,
  active,
  onSelect,
}: {
  item: CatalogItem
  eraTier: Tier
  rankTier?: Tier
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-slate-950/80 text-left transition duration-500 ${active ? 'scale-100 opacity-100' : 'scale-[0.92] border-slate-800 opacity-75'}`}
      style={active ? { borderColor: 'var(--brand)', boxShadow: '0 18px 50px var(--brand-glow)' } : undefined}
    >
      <ComponentImage item={item} priority={active} className="h-40 w-full" />
      <span className="flex flex-1 flex-col gap-2 p-3">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-black leading-snug text-white">{item.name}</span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            {rankTier && (
              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-black ${tierClass(rankTier)}`} title="Ranking 2026: rendimiento en juegos hoy">
                2026 {rankTier}
              </span>
            )}
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-black ${tierClass(eraTier)}`} title="Tier por época: comparado con piezas de su generación">
              época {eraTier}
            </span>
          </span>
        </span>
        <span className="text-[11px] text-slate-400">
          {item.releaseYear} · {item.priceUsd != null ? `$${item.priceUsd}` : 'sin precio'}
          {isConceptual(item) ? ' · conceptual' : ''}
        </span>
        <ul className="space-y-1 text-[11px] text-slate-300">
          {specHighlights(item).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </span>
    </button>
  )
}
