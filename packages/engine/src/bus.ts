import {
  BUS_BANDWIDTH_GBPS,
  isAgp,
  isPcie,
  linkBandwidthGbps,
  PCIE_RANK,
  type BusInterface,
  type ResolvedBuild,
} from '@pc/shared'

export interface BusReport {
  negotiatedInterface: BusInterface | null
  negotiatedLanes: number | null
  bandwidthGbps: number | null
  /** Fracción de rendimiento de GPU que se pierde por el enlace (0 a 0.5). */
  penalty: number
  blocked: boolean
  reason: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function analyzeBus(build: ResolvedBuild): BusReport {
  const gpu = build.gpu?.gpu
  if (!gpu) {
    return {
      negotiatedInterface: null,
      negotiatedLanes: null,
      bandwidthGbps: null,
      penalty: 0,
      blocked: false,
      reason: 'Sin GPU en el ensamble.',
    }
  }

  if (!gpu.busInterface) {
    return {
      negotiatedInterface: null,
      negotiatedLanes: null,
      bandwidthGbps: null,
      penalty: 0,
      blocked: false,
      reason: 'Interfaz de bus no catalogada: no se calcula penalización.',
    }
  }

  const board = build.motherboard?.motherboard
  let negotiated: BusInterface = gpu.busInterface
  let lanes: number | null = gpu.busLanes
  const notes: string[] = []

  if (board) {
    if (isAgp(gpu.busInterface) && board.agpSlot && isAgp(board.agpSlot)) {
      negotiated =
        BUS_BANDWIDTH_GBPS[gpu.busInterface] <= BUS_BANDWIDTH_GBPS[board.agpSlot]
          ? gpu.busInterface
          : board.agpSlot
    } else if (isPcie(gpu.busInterface) && board.pcieSlot && isPcie(board.pcieSlot)) {
      const gpuRank = PCIE_RANK[gpu.busInterface] ?? 0
      const slotRank = PCIE_RANK[board.pcieSlot] ?? 0
      negotiated = gpuRank <= slotRank ? gpu.busInterface : board.pcieSlot
      if (gpu.busLanes != null && board.pcieLanes != null) {
        lanes = Math.min(gpu.busLanes, board.pcieLanes)
      } else if (gpu.busLanes == null) {
        lanes = null
        notes.push('Carriles de la GPU no catalogados: la penalización no asume x16.')
      }
    } else if (isAgp(gpu.busInterface) && !board.agpSlot) {
      return {
        negotiatedInterface: null,
        negotiatedLanes: null,
        bandwidthGbps: null,
        penalty: 0,
        blocked: true,
        reason: 'No hay enlace: GPU AGP en una placa sin ranura AGP.',
      }
    } else if (isPcie(gpu.busInterface) && !board.pcieSlot) {
      return {
        negotiatedInterface: null,
        negotiatedLanes: null,
        bandwidthGbps: null,
        penalty: 0,
        blocked: true,
        reason: 'No hay enlace: GPU PCIe en una placa sin ranura PCIe.',
      }
    }
  }

  let linkRatio = 1
  if (isPcie(gpu.busInterface) && isPcie(negotiated)) {
    const genRatio = BUS_BANDWIDTH_GBPS[negotiated] / BUS_BANDWIDTH_GBPS[gpu.busInterface]
    const laneRatio = gpu.busLanes != null && lanes != null ? lanes / gpu.busLanes : 1
    linkRatio = genRatio * laneRatio
  } else if (isAgp(gpu.busInterface) && isAgp(negotiated)) {
    linkRatio = BUS_BANDWIDTH_GBPS[negotiated] / BUS_BANDWIDTH_GBPS[gpu.busInterface]
  }

  let penalty = 0
  if (linkRatio < 1) penalty += clamp((1 - linkRatio) * 0.45, 0, 0.4)

  const vram = gpu.vramMb
  const score = build.gpu?.performanceScore ?? 0
  if (vram != null && vram < 1024 && score > 20) {
    penalty += 0.12
    notes.push('VRAM por debajo de 1 GB: el desborde aumenta el tráfico por el bus.')
  } else if (vram != null && vram < 4096 && score > 50) {
    penalty += 0.06
    notes.push('VRAM justa para el índice de la GPU: se aplica una penalización leve de bus.')
  }

  penalty = clamp(penalty, 0, 0.5)
  const bandwidthGbps =
    lanes != null
      ? linkBandwidthGbps(negotiated, lanes)
      : isAgp(negotiated) || negotiated === 'pci' || negotiated === 'isa'
        ? BUS_BANDWIDTH_GBPS[negotiated]
        : null

  const laneLabel = lanes == null ? 'carriles desconocidos' : `x${lanes}`
  const reason = [
    `Enlace negociado ${negotiated} ${laneLabel}, penalización ${(penalty * 100).toFixed(0)}%.`,
    ...notes,
  ].join(' ')

  return {
    negotiatedInterface: negotiated,
    negotiatedLanes: lanes,
    bandwidthGbps,
    penalty,
    blocked: false,
    reason,
  }
}
