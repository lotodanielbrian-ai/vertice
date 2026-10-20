import { architectureTransientFactor, type Issue, type ResolvedBuild } from '@pc/shared'

export interface PowerReport {
  nominalWatts: number
  transientWatts: number
  recommendedPsuWatts: number
  psuWattage: number | null
  sustainedLoadRatio: number | null
  sustainedOk: boolean
  transientOk: boolean
  transientLimitWatts: number | null
  rail12vOk: boolean | null
  rail12vAmpsNeeded: number | null
  atxVersion: number | null
  notes: string[]
  issues: Issue[]
}

function storageWatts(build: ResolvedBuild): number {
  const disk = build.storage?.storage
  if (!disk) return 0
  if (disk.kind === 'hdd') return disk.interface === 'pata' ? 12 : 8
  if (disk.interface.startsWith('nvme')) return 7
  return 4
}

function roundUp50(value: number): number {
  return Math.ceil(value / 50) * 50
}

export function analyzePower(build: ResolvedBuild): PowerReport {
  const notes: string[] = []
  const cpuTdp = build.cpu?.tdpWatts ?? 0
  const gpuTdp = build.gpu?.tdpWatts ?? 0
  const cpuPeak =
    build.cpu?.cpu?.peakTransientTdpWatts ?? (build.cpu ? Math.round(cpuTdp * 1.25) : 0)
  if (build.cpu && build.cpu.cpu?.peakTransientTdpWatts == null) {
    notes.push('Pico del CPU estimado como 1.25× TDP: no hay PL2/MTP catalogado.')
  }

  const gpuPeak = build.gpu
    ? (build.gpu.gpu?.peakTransientSpikeWatts ??
      Math.round(gpuTdp * architectureTransientFactor(build.gpu.gpu?.architecture ?? '')))
    : 0
  if (build.gpu && build.gpu.gpu?.peakTransientSpikeWatts == null) {
    notes.push(
      `Pico de la GPU estimado con el factor de la arquitectura ${build.gpu.gpu?.architecture ?? 'desconocida'} (no hay medición de 20 ms).`,
    )
  }

  const ramWatts = build.ram?.ram
    ? Math.max(2, Math.ceil(build.ram.ram.capacityMb / 8192) * 3)
    : 0
  const boardWatts = build.motherboard ? 30 : 0
  const coolerWatts = build.cooler ? (build.cooler.cooler?.coolerType === 'liquid' ? 8 : 3) : 0
  const fanWatts = (build.case?.case?.fanSlots ?? (build.case ? 3 : 0)) * 2
  const rest = ramWatts + storageWatts(build) + coolerWatts + boardWatts + fanWatts

  const nominalWatts = cpuTdp + gpuTdp + rest
  const transientWatts = cpuPeak + gpuPeak + rest
  const psu = build.psu?.psu ?? null
  const psuWattage = psu?.wattage ?? null
  const atxVersion = psu?.atxVersion ?? null
  const atx3 = (atxVersion ?? 0) >= 3
  const sustainedLoadRatio = psuWattage ? nominalWatts / psuWattage : null
  const sustainedOk = psuWattage != null && nominalWatts <= psuWattage * 0.8
  const transientLimitWatts = psuWattage == null ? null : psuWattage * (atx3 ? 2 : 1.15)
  const transientOk = transientLimitWatts != null && transientWatts <= transientLimitWatts

  const rail12vAmpsNeeded = build.cpu || build.gpu ? (cpuPeak + gpuPeak) / 12 : null
  const rail12vOk =
    psu?.rail12vAmps != null && rail12vAmpsNeeded != null
      ? rail12vAmpsNeeded <= psu.rail12vAmps
      : null
  if (psu && psu.rail12vAmps == null) {
    notes.push('Amperaje del riel +12V no catalogado.')
  }
  if (atx3) {
    notes.push('Fuente ATX 3.x: se tolera un pico transitorio de hasta el 200% de la potencia nominal.')
  } else if (psu) {
    notes.push('Fuente anterior a ATX 3.0: el pico se evalúa contra el 115% de la potencia nominal.')
  }

  const recommendedPsuWatts = roundUp50(
    Math.max(nominalWatts / 0.7, transientWatts / (atx3 ? 1.6 : 1.1)),
  )

  const issues: Issue[] = []
  if (psu && !sustainedOk) {
    issues.push({
      severity: 'error',
      code: 'PSU_SUSTAINED',
      message: `La carga sostenida (${nominalWatts} W) supera el 80% de la fuente (${psuWattage} W).`,
      componentSlugs: [build.psu!.slug],
    })
  }
  if (psu && !transientOk) {
    issues.push({
      severity: 'warning',
      code: 'PSU_TRANSIENT',
      message: `El pico estimado (${transientWatts} W) supera el límite de la fuente (${Math.round(transientLimitWatts ?? 0)} W).`,
      componentSlugs: [build.psu!.slug, build.gpu?.slug].filter((slug): slug is string => !!slug),
    })
  }
  if (rail12vOk === false && build.psu) {
    issues.push({
      severity: 'error',
      code: 'PSU_RAIL_12V',
      message: `El riel +12V pide unos ${rail12vAmpsNeeded?.toFixed(1)} A y la fuente declara ${psu?.rail12vAmps} A.`,
      componentSlugs: [build.psu.slug],
    })
  }

  return {
    nominalWatts,
    transientWatts,
    recommendedPsuWatts,
    psuWattage,
    sustainedLoadRatio,
    sustainedOk,
    transientOk,
    transientLimitWatts,
    rail12vOk,
    rail12vAmpsNeeded,
    atxVersion,
    notes,
    issues,
  }
}
