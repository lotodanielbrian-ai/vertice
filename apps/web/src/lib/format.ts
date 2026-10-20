import type { CatalogItem } from '@pc/shared'

const CONNECTOR_LABEL: Record<string, string> = {
  pcie_8pin: '8-pin',
  pcie_6pin: '6-pin',
  hpwr_16pin: '12VHPWR',
  '12v_2x6': '12V-2x6',
  molex_4pin: 'Molex',
}

export function formatConnectors(connectors: Record<string, number> | null | undefined): string {
  if (!connectors) return 'no catalogados'
  const parts = Object.entries(connectors)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${count}× ${CONNECTOR_LABEL[key] ?? key}`)
  return parts.length > 0 ? parts.join(', ') : 'sin conector extra'
}

export function formatBus(bus: string | null | undefined): string {
  if (!bus) return 'no catalogado'
  if (bus.startsWith('pcie_')) return `PCIe ${bus.slice(5).replace('_', '.')}`
  if (bus.startsWith('agp_')) return `AGP ${bus.slice(4).toUpperCase()}`
  return bus.toUpperCase()
}

export function specHighlights(item: CatalogItem): string[] {
  if (item.gpu) {
    const vram = item.gpu.vramMb != null ? `${Math.round(item.gpu.vramMb / 1024)} GB ${item.gpu.vramType ?? ''}`.trim() : 'VRAM no catalogada'
    const shaders = item.gpu.shaderCores != null ? `${item.gpu.shaderCores.toLocaleString('es-AR')} shaders` : item.gpu.architecture
    return [vram, shaders, `${item.tdpWatts} W`]
  }
  if (item.cpu) {
    const boost = item.cpu.boostClockMhz ? `${(item.cpu.boostClockMhz / 1000).toFixed(2)} GHz` : 'reloj no catalogado'
    const l3 = item.cpu.l3CacheKb >= 1024 ? `${Math.round(item.cpu.l3CacheKb / 1024)} MB L3` : `${item.cpu.l3CacheKb} KB L3`
    const cores = `${item.cpu.cores} ${item.cpu.cores === 1 ? 'núcleo' : 'núcleos'}`
    const threads = `${item.cpu.threads} ${item.cpu.threads === 1 ? 'hilo' : 'hilos'}`
    return [`${cores} / ${threads}`, boost, l3]
  }
  return []
}

export function tierClass(tier: string): string {
  if (tier === 'S+' || tier === 'S') return 'border-emerald-500/40 text-emerald-300'
  if (tier === 'A' || tier === 'B') return 'border-cyan-500/30 text-cyan-200'
  if (tier === 'C' || tier === 'D') return 'border-amber-500/30 text-amber-200'
  return 'border-rose-500/30 text-rose-200'
}
