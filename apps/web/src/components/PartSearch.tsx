import type { CatalogItem } from '@pc/shared'
import { useMemo, useState } from 'react'
import { ComponentImage } from './ComponentImage'
import { useNavStore } from '../nav'

export function PartSearch({ items }: { items: CatalogItem[] }) {
  const openPart = useNavStore((state) => state.openPart)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter((item) => item.type === 'gpu' || item.type === 'cpu')
      .filter((item) => !q || `${item.name} ${item.releaseYear}`.toLowerCase().includes(q))
      .slice(0, 8)
  }, [items, query])

  return (
    <div className="relative hidden min-w-48 flex-1 md:block">
      <input
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar GPU o CPU"
        aria-label="Buscar GPU o CPU"
        className="w-full rounded-full border border-slate-700 bg-slate-950 px-4 py-1.5 text-xs outline-none focus:border-cyan-400"
      />
      {open && query && (
        <ul className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
          {results.map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => {
                  if (item.type === 'gpu' || item.type === 'cpu') openPart(item.slug, item.type)
                  setOpen(false)
                  setQuery('')
                }}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-slate-800"
              >
                <ComponentImage item={item} className="h-8 w-12" />
                <span className="font-bold text-white">{item.name}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-2 text-xs text-slate-500">Sin resultados.</li>}
        </ul>
      )}
    </div>
  )
}
