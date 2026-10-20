import type { CatalogItem } from '@pc/shared'
import { useState } from 'react'
import { BrandRenderCard } from './BrandRenderCard'

export function ComponentImage({
  item,
  className = 'h-16 w-24',
  priority = false,
}: {
  item: CatalogItem
  className?: string
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const image = item.image
  if (!image || image.kind === 'family_fallback' || failed) {
    return <BrandRenderCard item={item} className={`rounded-lg ${className}`} />
  }
  const credit = image.author || image.license ? `${image.author ?? 'Autor desconocido'} · ${image.license ?? ''}`.trim() : null
  return (
    <span className={`group relative block overflow-hidden rounded-lg bg-slate-900 ${className}`} title={credit ?? item.name}>
      <img
        src={image.thumbUrl ?? image.url}
        alt={item.name}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
        className="h-full w-full object-contain bg-slate-950"
      />
      {credit && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-slate-950/85 px-1 py-0.5 text-[8px] text-slate-300 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          {credit}
        </span>
      )}
    </span>
  )
}
