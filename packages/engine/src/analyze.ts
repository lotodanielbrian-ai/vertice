import type { CatalogItem, Issue, ResolvedBuild } from '@pc/shared'
import { analyzeBottleneck, type BottleneckReport } from './bottleneck'
import { analyzeBus, type BusReport } from './bus'
import { checkCompatibility } from './compatibility'
import { EMPTY_CONTEXT, type EngineContext } from './context'
import { analyzePower, type PowerReport } from './power'
import { analyzeThermal, type ThermalReport } from './thermal'
import { analyzeTiers, rankCatalog, type TierReport } from './tier'
import { suggestUpgrades, type UpgradeSuggestion } from './upgrade'

export interface Analysis {
  issues: Issue[]
  power: PowerReport
  bus: BusReport
  thermal: ThermalReport
  bottleneck: BottleneckReport
  tiers: TierReport
  upgrades: UpgradeSuggestion[]
}

export function analyzeBuild(
  build: ResolvedBuild,
  catalog: CatalogItem[],
  context: EngineContext = EMPTY_CONTEXT,
): Analysis {
  const compatibility = checkCompatibility(build, context)
  const power = analyzePower(build)
  const bus = analyzeBus(build)
  const thermal = analyzeThermal(build)
  const bottleneck = analyzeBottleneck(build, bus, thermal)
  const ranks = rankCatalog(catalog)
  const tiers = analyzeTiers(build, ranks, thermal, power)
  const upgrades = suggestUpgrades(build, catalog, context, bottleneck, power, thermal)
  const issues = [...compatibility, ...power.issues]
  return { issues, power, bus, thermal, bottleneck, tiers, upgrades }
}
