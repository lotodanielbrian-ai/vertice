import type { ResolvedBuild } from '@pc/shared'

export interface ThermalReport {
  estimatedCpuTempC: number
  throttlingRisk: boolean
  fanRpm: number
  fanPercent: number
  maxRpm: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function analyzeThermal(build: ResolvedBuild): ThermalReport {
  const heat = build.cpu?.cpu?.peakTransientTdpWatts ?? build.cpu?.tdpWatts ?? 0
  const capacity = build.cooler?.cooler?.tdpMax ?? 0
  const airflow = (build.case?.case?.airflowScore ?? 60) / 100
  const effective = capacity * (0.75 + 0.25 * airflow)
  const ratio = effective > 0 ? heat / effective : heat > 0 ? 2 : 0
  const estimatedCpuTempC = Math.round(clamp(38 + ratio * 47, 30, 115))
  const throttlingRisk = capacity > 0 && heat > capacity
  const maxRpm = build.cooler?.cooler?.maxRpm ?? 0
  const fanPercent = clamp(0.28 + (estimatedCpuTempC - 40) / 55, 0.28, 1)
  return {
    estimatedCpuTempC,
    throttlingRisk,
    fanRpm: Math.round(maxRpm * fanPercent),
    fanPercent,
    maxRpm,
  }
}
