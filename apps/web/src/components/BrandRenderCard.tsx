import { brandOf, BRAND_THEME, type CatalogItem } from '@pc/shared'

function GpuSilhouette({ color, fans, blower }: { color: string; fans: number; blower: boolean }) {
  const count = blower ? 1 : Math.max(fans, 1)
  const positions = count === 1 ? [160] : count === 2 ? [110, 210] : [78, 160, 242]
  return (
    <g>
      <rect x="28" y="48" width="264" height="92" rx="14" fill="#111827" stroke={color} strokeWidth="3" />
      <rect x="36" y="56" width="248" height="10" rx="4" fill={color} opacity="0.85" />
      {positions.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="100" r={blower ? 28 : 24} fill="#020617" stroke={color} strokeWidth="2" />
          <circle cx={cx} cy="100" r="6" fill={color} />
        </g>
      ))}
      <rect x="292" y="62" width="10" height="64" rx="2" fill="#52525b" />
    </g>
  )
}

function CpuSilhouette({ color }: { color: string }) {
  return (
    <g>
      <rect x="78" y="36" width="164" height="112" rx="8" fill="#14532d" stroke="#166534" />
      <rect x="98" y="52" width="124" height="84" rx="6" fill="#d6d3d1" />
      <path d={`M98 52 L122 52 L98 76 Z`} fill={color} />
      <rect x="112" y="78" width="96" height="6" rx="2" fill="#44403c" opacity="0.7" />
      <rect x="112" y="92" width="72" height="6" rx="2" fill="#44403c" opacity="0.45" />
    </g>
  )
}

export function BrandRenderCard({ item, className = '' }: { item: CatalogItem; className?: string }) {
  const brand = brandOf(item)
  const color = brand ? BRAND_THEME[brand].hex : '#64748b'
  const form = item.gpu?.visual.form ?? ''
  const retro = form.includes('retro') || (item.type === 'gpu' && item.releaseYear < 2008)
  return (
    <span className={`relative block overflow-hidden bg-slate-950 ${className}`} title="Ilustración generada, no es una foto del producto">
      <svg viewBox="0 0 320 180" className="h-full w-full" role="img" aria-label={`Ilustración de ${item.name}`}>
        <rect width="320" height="180" fill="#020617" />
        <rect x="0" y="150" width="320" height="30" fill={color} opacity="0.15" />
        {item.type === 'cpu' ? (
          <CpuSilhouette color={color} />
        ) : (
          <GpuSilhouette color={retro ? '#a1a1aa' : color} fans={item.gpu?.visual.fans ?? 2} blower={form === 'blower'} />
        )}
        <text x="160" y="168" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif">
          {item.name.length > 36 ? `${item.name.slice(0, 34)}…` : item.name}
        </text>
      </svg>
      <span className="absolute left-1 top-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        Ilustración
      </span>
    </span>
  )
}
