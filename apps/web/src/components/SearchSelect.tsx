import type { CatalogItem } from '@pc/shared'
import { useEffect, useId, useRef, useState } from 'react'
import { ComponentImage } from './ComponentImage'

export function SearchSelect({
  label,
  items,
  value,
  onChange,
}: {
  label: string
  items: CatalogItem[]
  value: string
  onChange: (slug: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = items.find((item) => item.slug === value)
  const filtered = items
    .filter((item) => {
      if (!query) return true
      const haystack = `${item.name} ${item.releaseYear} ${item.manufacturer}`.toLowerCase()
      return haystack.includes(query.toLowerCase())
    })
    .slice(0, 40)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={root} className="relative min-w-64 flex-1">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-left text-sm"
      >
        {selected && <ComponentImage item={selected} className="h-8 w-12 shrink-0" />}
        <span className="truncate">{selected?.name ?? 'Elegir pieza'}</span>
      </button>
      {open && (
        <div id={listId} className="absolute z-30 mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setOpen(false)
            }}
            placeholder="Buscar por nombre o año"
            className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm outline-none focus:border-cyan-400"
          />
          <ul className="max-h-64 space-y-1 overflow-y-auto custom-scrollbar">
            {filtered.map((item) => (
              <li key={item.slug}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(item.slug)
                    setOpen(false)
                    setQuery('')
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-slate-800"
                >
                  <ComponentImage item={item} className="h-8 w-12 shrink-0" />
                  <span>
                    <span className="block font-bold text-white">{item.name}</span>
                    <span className="text-[10px] text-slate-500">{item.releaseYear} · {item.manufacturer}</span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-2 py-3 text-xs text-slate-500">Sin resultados.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
