import { describe, expect, it } from 'vitest'
import { analyzePower } from '../src/power'
import { build, item } from './fixtures'

function psu(wattage: number, atxVersion: number, rail12vAmps: number | null = null) {
  return item({
    slug: 'psu',
    type: 'psu',
    name: `${wattage}W`,
    psu: {
      wattage,
      formFactor: 'atx',
      modular: 'full_modular',
      efficiency: '80+ Gold',
      atxVersion,
      rail12vAmps,
      rail5vAmps: null,
      rail33vAmps: null,
      connectors: null,
      topology: 'dc_dc',
      has12vhpwr: atxVersion >= 3,
    },
  })
}

const hot = build({
  cpu: item({ slug: 'cpu', type: 'cpu', name: 'CPU', tdpWatts: 250, cpu: {
    socketName: 'LGA1700', architecture: 'Raptor Lake', lithographyNm: 10, cores: 24, threads: 32,
    performanceCores: 8, efficiencyCores: 16, baseClockMhz: 3200, boostClockMhz: 6000,
    l1CacheKb: 0, l2CacheKb: 0, l3CacheKb: 36864, maxRamGen: 'ddr5', maxMemoryChannels: 2,
    integratedGraphics: null, peakTransientTdpWatts: 253, instructionSets: [], ipcIndex: 1.8,
  } }),
  gpu: item({ slug: 'gpu', type: 'gpu', name: 'GPU', tdpWatts: 450, gpu: {
    architecture: 'Ampere', busInterface: 'pcie_4_0', busLanes: 16, lithographyNm: null,
    baseClockMhz: null, boostClockMhz: null, shaderCores: null, tmus: null, rops: null,
    rayTracingCores: 0, tensorCores: 0, vramType: 'GDDR6X', vramMb: 24576, memoryBusWidthBits: 384,
    memoryBandwidthGbps: null, lengthMm: 320, heightMm: null, slotWidth: null, powerConnectors: null,
    recommendedPsuWatts: null, peakTransientSpikeWatts: 800, directxMax: null, vulkan: true,
    visual: { form: 'massive', fans: 3, color: 0, accentColor: 0 },
  } }),
})

describe('potencia', () => {
  it('marca la carga sostenida cuando la fuente queda por encima del 80%', () => {
    const report = analyzePower({ ...hot, psu: psu(500, 2.4) })
    expect(report.sustainedOk).toBe(false)
    expect(report.issues.some((issue) => issue.code === 'PSU_SUSTAINED')).toBe(true)
  })

  it('deja pasar un pico dentro del 200% en ATX 3 y lo rechaza en ATX 2', () => {
    const modern = analyzePower({ ...hot, psu: psu(850, 3.1) })
    const legacy = analyzePower({ ...hot, psu: psu(850, 2.4) })
    expect(modern.transientLimitWatts).toBe(1700)
    expect(modern.transientOk).toBe(true)
    expect(legacy.transientOk).toBe(false)
    expect(legacy.issues.some((issue) => issue.code === 'PSU_TRANSIENT')).toBe(true)
  })

  it('audita el riel de +12V cuando hay amperaje catalogado', () => {
    const report = analyzePower({ ...hot, psu: psu(1000, 3, 40) })
    expect(report.rail12vOk).toBe(false)
    expect(report.issues.some((issue) => issue.code === 'PSU_RAIL_12V')).toBe(true)
  })
})
