import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping } from 'three'

export function useBrushedNormal() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d')
    if (!context) return null
    context.fillStyle = '#8080ff'
    context.fillRect(0, 0, 128, 128)
    for (let y = 0; y < 128; y += 2) {
      const shade = 118 + (y % 4 === 0 ? 28 : -12)
      context.strokeStyle = `rgb(${shade},${shade},255)`
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(128, y)
      context.stroke()
    }
    const texture = new CanvasTexture(canvas)
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(8, 3)
    return texture
  }, [])
}

export function gpuPalette(input: {
  manufacturer: string
  releaseYear: number
  color: number
  accent: number
  form: string
}) {
  const retro = input.releaseYear < 2009 || input.form.includes('retro')
  const ati = input.manufacturer === 'ATI'
  const amd = input.manufacturer === 'AMD'
  const nvidia = input.manufacturer === 'NVIDIA'
  const intel = input.manufacturer === 'Intel'
  const shroud = intel ? 0x18181b : ati || (amd && input.releaseYear < 2015) ? 0x9f1239 : input.color
  const pcb = intel ? 0x0c1a33 : ati ? 0x7f1d1d : retro && nvidia ? 0x14532d : 0x052e16
  const accent = intel ? 0x38bdf8 : input.accent
  return { retro, ati, amd, nvidia, intel, shroud, pcb, accent }
}
