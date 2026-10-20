import {
  isAgp,
  isPcie,
  PCIE_RANK,
  RAM_GEN_RANK,
  storageFits,
  type Issue,
  type ResolvedBuild,
} from '@pc/shared'
import type { EngineContext } from './context'

type Rule = (build: ResolvedBuild, context: EngineContext) => Issue | null

function issue(
  severity: Issue['severity'],
  code: string,
  message: string,
  slugs: (string | undefined)[],
): Issue {
  return {
    severity,
    code,
    message,
    componentSlugs: slugs.filter((slug): slug is string => !!slug),
  }
}

const socketMatch: Rule = (build) => {
  const cpu = build.cpu?.cpu
  const board = build.motherboard?.motherboard
  if (!cpu || !board) return null
  if (cpu.socketName !== board.socketName) {
    return issue(
      'error',
      'SOCKET_MISMATCH',
      `El procesador usa ${cpu.socketName} y la placa ${board.socketName}. No hay anclaje físico compatible.`,
      [build.cpu?.slug, build.motherboard?.slug],
    )
  }
  return null
}

const chipsetMatch: Rule = (build, context) => {
  const board = build.motherboard?.motherboard
  if (!board || context.socketChipsets.length === 0) return null
  const ok = context.socketChipsets.some(
    (pair) => pair.socketName === board.socketName && pair.chipsetName === board.chipsetName,
  )
  if (!ok) {
    return issue(
      'error',
      'CHIPSET_SOCKET',
      `El chipset ${board.chipsetName} no está asociado al zócalo ${board.socketName} en la matriz de compatibilidad.`,
      [build.motherboard?.slug],
    )
  }
  return null
}

const ramBoard: Rule = (build) => {
  const ram = build.ram?.ram
  const board = build.motherboard?.motherboard
  if (!ram || !board) return null
  if (ram.gen !== board.ramGen) {
    return issue(
      'error',
      'RAM_GEN_BOARD',
      `La memoria es ${ram.gen.toUpperCase()} y la placa solo acepta ${board.ramGen.toUpperCase()}.`,
      [build.ram?.slug, build.motherboard?.slug],
    )
  }
  return null
}

const ramCpu: Rule = (build) => {
  const ram = build.ram?.ram
  const cpu = build.cpu?.cpu
  if (!ram || !cpu) return null
  if (RAM_GEN_RANK[ram.gen] > RAM_GEN_RANK[cpu.maxRamGen]) {
    return issue(
      'error',
      'RAM_GEN_CPU',
      `El procesador admite hasta ${cpu.maxRamGen.toUpperCase()} y el módulo es ${ram.gen.toUpperCase()}.`,
      [build.cpu?.slug, build.ram?.slug],
    )
  }
  return null
}

const formFactor: Rule = (build) => {
  const board = build.motherboard?.motherboard
  const pcCase = build.case?.case
  if (!board || !pcCase) return null
  if (!pcCase.supportedFormFactors.includes(board.formFactor)) {
    return issue(
      'error',
      'FORM_FACTOR',
      `La placa ${board.formFactor} no entra en un gabinete limitado a ${pcCase.supportedFormFactors.join(', ')}.`,
      [build.motherboard?.slug, build.case?.slug],
    )
  }
  return null
}

const gpuClearance: Rule = (build) => {
  const length = build.gpu?.gpu?.lengthMm
  const max = build.case?.case?.maxGpuLengthMm
  if (length == null || max == null) return null
  if (length > max) {
    return issue(
      'error',
      'GPU_CLEARANCE',
      `La GPU mide ${length} mm y el gabinete admite hasta ${max} mm.`,
      [build.gpu?.slug, build.case?.slug],
    )
  }
  return null
}

const coolerClearance: Rule = (build) => {
  const cooler = build.cooler?.cooler
  const max = build.case?.case?.maxCoolerHeightMm
  if (!cooler || cooler.coolerType === 'liquid' || cooler.heightMm == null || max == null) return null
  if (cooler.heightMm > max) {
    return issue(
      'error',
      'COOLER_CLEARANCE',
      `El disipador mide ${cooler.heightMm} mm y el gabinete admite hasta ${max} mm de alto.`,
      [build.cooler?.slug, build.case?.slug],
    )
  }
  return null
}

const coolerSocket: Rule = (build) => {
  const cooler = build.cooler?.cooler
  const socket = build.cpu?.cpu?.socketName
  if (!cooler || !socket) return null
  if (cooler.socketNames.length === 0) {
    return issue(
      'warning',
      'COOLER_SOCKET_UNKNOWN',
      'Este disipador no tiene zócalos catalogados. Verificá el kit de montaje.',
      [build.cooler?.slug, build.cpu?.slug],
    )
  }
  if (!cooler.socketNames.includes(socket)) {
    return issue(
      'error',
      'COOLER_SOCKET',
      `El disipador no incluye anclaje para ${socket}.`,
      [build.cooler?.slug, build.cpu?.slug],
    )
  }
  return null
}

const coolerHeadroom: Rule = (build) => {
  const cooler = build.cooler?.cooler
  const cpu = build.cpu
  if (!cooler || !cpu) return null
  const required = cpu.cpu?.peakTransientTdpWatts ?? cpu.tdpWatts
  if (cooler.tdpMax < required) {
    return issue(
      'warning',
      'THERMAL_HEADROOM',
      `El disipador evacúa ${cooler.tdpMax} W y el procesador puede pedir ${required} W. Hay riesgo de throttling.`,
      [build.cooler?.slug, cpu.slug],
    )
  }
  return null
}

const busPhysical: Rule = (build) => {
  const gpu = build.gpu?.gpu
  const board = build.motherboard?.motherboard
  if (!gpu || !board) return null
  if (!gpu.busInterface) {
    return issue(
      'info',
      'GPU_BUS_UNKNOWN',
      'La interfaz de la GPU no está catalogada (hubo variantes AGP y PCIe). No se puede validar el slot.',
      [build.gpu?.slug],
    )
  }
  if (isAgp(gpu.busInterface) && !board.agpSlot) {
    return issue(
      'error',
      'BUS_PHYSICAL',
      `La GPU es ${gpu.busInterface.toUpperCase()} y la placa no tiene ranura AGP. AGP y PCI Express no son intercambiables.`,
      [build.gpu?.slug, build.motherboard?.slug],
    )
  }
  if (isPcie(gpu.busInterface) && !board.pcieSlot) {
    return issue(
      'error',
      'BUS_PHYSICAL',
      'La GPU es PCI Express y la placa no tiene ranura PCIe.',
      [build.gpu?.slug, build.motherboard?.slug],
    )
  }
  if (
    isPcie(gpu.busInterface) &&
    board.pcieSlot &&
    isPcie(board.pcieSlot) &&
    (PCIE_RANK[board.pcieSlot] ?? 0) < (PCIE_RANK[gpu.busInterface] ?? 0)
  ) {
    return issue(
      'info',
      'BUS_DOWNGRADE',
      `La GPU negociará ${board.pcieSlot} en lugar de ${gpu.busInterface}. El enlace funciona, con menos ancho de banda.`,
      [build.gpu?.slug, build.motherboard?.slug],
    )
  }
  return null
}

const storageInterface: Rule = (build) => {
  const disk = build.storage?.storage
  const board = build.motherboard?.motherboard
  if (!disk || !board) return null
  if (!storageFits(disk.interface, board.storageInterfaces)) {
    return issue(
      'error',
      'STORAGE_INTERFACE',
      `El almacenamiento usa ${disk.interface} y la placa no lo expone.`,
      [build.storage?.slug, build.motherboard?.slug],
    )
  }
  return null
}

const gpuPowerConnectors: Rule = (build) => {
  const gpu = build.gpu?.gpu
  const psu = build.psu?.psu
  if (!gpu || !psu) return null
  const needed = gpu.powerConnectors
  if (!needed) {
    return issue(
      'info',
      'GPU_POWER_UNKNOWN',
      'Los conectores de alimentación de esta GPU no están catalogados. No se puede auditar el cableado.',
      [build.gpu?.slug],
    )
  }
  const hpwr = (needed.hpwr_16pin ?? 0) + (needed['12v_2x6'] ?? 0)
  if (hpwr > 0 && !psu.has12vhpwr) {
    return issue(
      'error',
      'GPU_POWER_CONNECTORS',
      'La GPU pide un conector 12VHPWR / 12V-2x6 y la fuente no lo trae.',
      [build.gpu?.slug, build.psu?.slug],
    )
  }
  if (!psu.connectors) return null
  for (const [key, count] of Object.entries(needed)) {
    if (key === 'hpwr_16pin' || key === '12v_2x6') continue
    const have = psu.connectors[key] ?? 0
    if (have < count) {
      return issue(
        'error',
        'GPU_POWER_CONNECTORS',
        `La GPU necesita ${count} conectores ${key} y la fuente declara ${have}.`,
        [build.gpu?.slug, build.psu?.slug],
      )
    }
  }
  return null
}

const psuForm: Rule = (build) => {
  const psu = build.psu?.psu
  const pcCase = build.case?.case
  if (!psu || !pcCase) return null
  if (psu.formFactor !== pcCase.psuFormFactor) {
    return issue(
      'error',
      'PSU_FORM',
      `La fuente es ${psu.formFactor} y el gabinete admite ${pcCase.psuFormFactor}.`,
      [build.psu?.slug, build.case?.slug],
    )
  }
  return null
}

const RULES: Rule[] = [
  socketMatch,
  chipsetMatch,
  ramBoard,
  ramCpu,
  formFactor,
  gpuClearance,
  coolerClearance,
  coolerSocket,
  coolerHeadroom,
  busPhysical,
  storageInterface,
  gpuPowerConnectors,
  psuForm,
]

export function checkCompatibility(build: ResolvedBuild, context: EngineContext): Issue[] {
  return RULES.flatMap((rule) => {
    const found = rule(build, context)
    return found ? [found] : []
  })
}
