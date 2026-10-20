import type { ComponentType, ShowroomBrand } from '@pc/shared'
import type { BrandId, FamilyId } from '../nav'

const FILE = {
  nvidia: '/images/brands/nvidia.webp',
  amd: '/images/brands/amd.webp',
  radeon: '/images/brands/radeon.webp',
  ryzen: '/images/brands/ryzen.webp',
  intel: '/images/brands/intel.webp',
  arc: '/images/brands/arc.webp',
} as const

function keyOf(brand: ShowroomBrand | BrandId | null | undefined): 'nvidia' | 'amd' | 'intel' | null {
  if (!brand) return null
  const value = brand.toLowerCase()
  if (value === 'nvidia' || value === 'amd' || value === 'intel') return value
  return null
}

/** Logo de la serie: GeForce, Radeon, Arc, Ryzen o Intel. */
export function seriesLogo(family: FamilyId | ComponentType, brand: ShowroomBrand | BrandId | null | undefined): string | null {
  const key = keyOf(brand)
  if (!key) return null
  if (family === 'gpu' && key === 'amd') return FILE.radeon
  if (family === 'gpu' && key === 'intel') return FILE.arc
  if (family === 'cpu' && key === 'amd') return FILE.ryzen
  return FILE[key]
}

/** Marca genérica, para pestañas y tarjetas del ranking. */
export function markLogo(brand: ShowroomBrand | BrandId | null | undefined): string | null {
  const key = keyOf(brand)
  return key ? FILE[key] : null
}
