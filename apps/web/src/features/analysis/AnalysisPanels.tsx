import type { Analysis } from '@pc/engine'
import type { BuildSlot } from '@pc/shared'
import { useBuildStore } from '../../store'

const WORKLOAD_LABEL: Record<string, string> = {
  retro: 'Retro',
  esports: 'eSports',
  aaa: 'AAA',
  rt: 'Ray tracing',
  path: 'Path tracing',
  render: 'Render 3D',
  encode: 'Encode',
}

const RESOLUTIONS = ['1024×768', '1280×720', '1920×1080', '2560×1440', '3840×2160', '7680×4320']
const WORKLOADS = ['retro', 'esports', 'aaa', 'rt', 'path', 'render', 'encode']

function cellClass(limiting: string): string {
  if (limiting === 'gpu') return 'bg-rose-500/80'
  if (limiting === 'cpu') return 'bg-amber-500/80'
  if (limiting === 'balanced') return 'bg-emerald-500/70'
  return 'bg-slate-700'
}

export function BottleneckHeatmap({ analysis }: { analysis: Analysis }) {
  return (
    <section className="glass-panel rounded-2xl p-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Matriz de cuello de botella</h3>
      <p className="mt-1 text-[11px] text-slate-500">Verde equilibrado, ámbar límite de CPU, rosa límite de GPU. El número es el desbalance.</p>
      <div className="mt-3 min-w-0 overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[520px] text-[10px]">
          <thead>
            <tr className="text-slate-500">
              <th className="p-1 text-left">Carga</th>
              {RESOLUTIONS.map((resolution) => (
                <th key={resolution} className="p-1 font-bold">{resolution.replace('×', 'x')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WORKLOADS.map((workload) => (
              <tr key={workload}>
                <td className="p-1 font-bold text-slate-300">{WORKLOAD_LABEL[workload]}</td>
                {RESOLUTIONS.map((resolution) => {
                  const cell = analysis.bottleneck.profiles.find(
                    (profile) => profile.workload === workload && profile.resolution === resolution,
                  )
                  if (!cell) return <td key={resolution} className="p-1 text-center text-slate-700">—</td>
                  return (
                    <td key={resolution} className="p-1">
                      <div className={`rounded px-1 py-1 text-center font-black text-slate-950 ${cellClass(cell.limiting)}`} title={`${cell.limiting} CPU ${cell.cpuUtilization}% GPU ${cell.gpuUtilization}%`}>
                        {cell.limiting === 'blocked' ? 'X' : `${cell.imbalancePercent}%`}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function IssuePanel({ analysis }: { analysis: Analysis }) {
  const errors = analysis.issues.filter((issue) => issue.severity === 'error')
  const rest = analysis.issues.filter((issue) => issue.severity !== 'error')
  return (
    <section className="glass-panel rounded-2xl p-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
        Compatibilidad {errors.length > 0 ? `· ${errors.length} bloqueos` : '· sin bloqueos'}
      </h3>
      <ul className="mt-3 space-y-2">
        {analysis.issues.length === 0 && <li className="text-sm text-emerald-300">El ensamble pasa todas las reglas.</li>}
        {[...errors, ...rest].map((issue) => (
          <li key={`${issue.code}-${issue.message}`} className={`rounded-lg border px-3 py-2 text-xs ${issue.severity === 'error' ? 'border-rose-500/50 bg-rose-500/10 text-rose-100' : issue.severity === 'warning' ? 'border-amber-500/40 bg-amber-500/10 text-amber-100' : 'border-slate-700 bg-slate-900/60 text-slate-300'}`}>
            <span className="font-black">{issue.code}</span>
            <p className="mt-1 leading-relaxed">{issue.message}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function PowerCurve({ analysis }: { analysis: Analysis }) {
  const power = analysis.power
  const scale = Math.max(power.transientWatts, power.psuWattage ?? 0, power.transientLimitWatts ?? 0, 1)
  const bar = (value: number, className: string, label: string) => (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-slate-200">{Math.round(value)} W</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div className={`h-2 rounded-full ${className}`} style={{ width: `${Math.min(100, (value / scale) * 100)}%` }} />
      </div>
    </div>
  )
  return (
    <section className="glass-panel rounded-2xl p-4 space-y-3">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Curva de potencia</h3>
      {bar(power.nominalWatts, 'bg-cyan-400', 'Carga sostenida')}
      {bar(power.transientWatts, 'bg-fuchsia-400', 'Pico transitorio')}
      {power.psuWattage != null && bar(power.psuWattage, 'bg-emerald-400', 'Fuente nominal')}
      {power.transientLimitWatts != null && bar(power.transientLimitWatts, 'bg-amber-300', 'Techo de pico de la fuente')}
      <p className="text-[11px] leading-relaxed text-slate-400">
        Recomendada: {power.recommendedPsuWatts} W
        {power.atxVersion != null ? ` · ATX ${power.atxVersion}` : ''}
        {power.rail12vAmpsNeeded != null ? ` · +12V ${power.rail12vAmpsNeeded.toFixed(1)} A` : ''}
        {power.sustainedLoadRatio != null ? ` · carga ${(power.sustainedLoadRatio * 100).toFixed(0)}%` : ''}
      </p>
      {power.notes.map((note) => (
        <p key={note} className="text-[11px] text-slate-500">{note}</p>
      ))}
    </section>
  )
}

export function UpgradeList({ analysis }: { analysis: Analysis }) {
  const setSlot = useBuildStore((state) => state.setSlot)
  return (
    <section className="glass-panel rounded-2xl p-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Ruta de actualización</h3>
      <ul className="mt-3 space-y-2">
        {analysis.upgrades.length === 0 && (
          <li className="text-sm text-slate-400">No hay un salto compatible con mejor retorno en el perfil dominante.</li>
        )}
        {analysis.upgrades.map((upgrade) => (
          <li key={`${upgrade.slot}-${upgrade.toSlug}`} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">{upgrade.toName}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{upgrade.reason}</p>
                <p className="mt-1 font-mono text-[11px] text-cyan-300">
                  +{upgrade.deltaScore.toFixed(0)} pts
                  {upgrade.deltaPrice != null ? ` · ${upgrade.deltaPrice >= 0 ? '+' : ''}$${upgrade.deltaPrice}` : ''}
                  {upgrade.costPerScore != null ? ` · $${upgrade.costPerScore.toFixed(2)}/pt` : ''}
                  {upgrade.perfPerWatt != null ? ` · ${upgrade.perfPerWatt.toFixed(2)} pts/W` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSlot(upgrade.slot as BuildSlot, upgrade.toSlug)}
                className="shrink-0 rounded-lg bg-cyan-500 px-3 py-1.5 text-[11px] font-black uppercase text-slate-950"
              >
                Aplicar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
