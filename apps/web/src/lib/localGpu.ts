import type { CatalogItem } from '@pc/shared'
import { useEffect, useState } from 'react'
import { marketQuery, matchCatalogGpu } from './market'

export function rendererString(): string | null {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl')
    if (!gl) return null
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (!ext) return null
    const value = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
    return typeof value === 'string' && value.trim() ? value.trim() : null
  } catch {
    return null
  }
}

export function matchInstalledGpu(items: CatalogItem[], renderer: string | null): CatalogItem | null {
  if (!renderer) return null
  return matchCatalogGpu(items, renderer)
}

export function shortGpuLabel(item: CatalogItem): string {
  const token = marketQuery(item)
  return token === item.name ? item.name : token.toUpperCase()
}

export function shortRenderer(value: string): string {
  const cleaned = value.replace(/^ANGLE\s*\(/i, '').replace(/\)$/, '').trim()
  return cleaned.length > 48 ? `${cleaned.slice(0, 46)}…` : cleaned
}

export function useInstalledGpu(items: CatalogItem[]) {
  const [state, setState] = useState<{ renderer: string | null; item: CatalogItem | null; ready: boolean } | null>(null)
  useEffect(() => {
    const renderer = rendererString()
    const ready = items.length > 0
    setState({ renderer, item: ready ? matchInstalledGpu(items, renderer) : null, ready })
  }, [items])
  return state
}
