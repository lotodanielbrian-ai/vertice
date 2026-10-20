import type { CatalogItem, Tier } from '@pc/shared'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ProductCard } from './ProductCard'

export function ProductCarousel({
  items,
  ranks,
  rankTiers,
  onSelect,
}: {
  items: CatalogItem[]
  ranks: Map<string, Tier>
  rankTiers: Map<string, Tier>
  onSelect: (item: CatalogItem) => void
}) {
  const reduce = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const plugins = useMemo(
    () => (reduce || items.length < 2 ? [] : [Autoplay({ delay: 4200, stopOnMouseEnter: true, stopOnInteraction: false })]),
    [items.length, reduce],
  )
  const [ref, api] = useEmblaCarousel({ loop: items.length > 2, align: 'center' }, plugins)
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!api) return
    const update = () => setSelected(api.selectedScrollSnap())
    api.on('select', update)
    api.on('reInit', update)
    update()
    return () => {
      api.off('select', update)
      api.off('reInit', update)
    }
  }, [api])

  if (items.length === 0) return null

  return (
    <section
      className="relative"
      aria-roledescription="carrusel"
      aria-label="Piezas destacadas"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') api?.scrollNext()
        if (event.key === 'ArrowLeft') api?.scrollPrev()
      }}
    >
      <div ref={ref} className="overflow-hidden">
        <div className="flex">
          {items.map((item, index) => (
            <div key={item.slug} className="min-w-0 flex-[0_0_86%] px-2 sm:flex-[0_0_48%] lg:flex-[0_0_34%]">
              <ProductCard
                item={item}
                eraTier={ranks.get(item.slug) ?? item.baseTier}
                rankTier={rankTiers.get(item.slug)}
                active={index === selected}
                onSelect={() => onSelect(item)}
              />
            </div>
          ))}
        </div>
      </div>
      {items.length > 1 && (
        <>
          <button type="button" aria-label="Anterior" onClick={() => api?.scrollPrev()} className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-slate-950/80 p-2 text-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Siguiente" onClick={() => api?.scrollNext()} className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-slate-950/80 p-2 text-white">
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="mt-3 flex justify-center gap-1.5">
            {items.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                aria-label={`Ir a ${item.name}`}
                onClick={() => api?.scrollTo(index)}
                className={`h-1.5 rounded-full transition-all ${index === selected ? 'w-6' : 'w-1.5 bg-slate-600'}`}
                style={index === selected ? { background: 'var(--brand)' } : undefined}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
