/** 文档屏的出口：一屏导出成 HTML、Tailwind、JSX 或 Vue。代码交接用这份。 */
import { createRequire } from 'node:module'
import { renderNodesToHTML } from '@open-pencil/core/io/formats/html'
import { sceneNodeToJSX } from '@open-pencil/design-jsx'
import { comparePNGs, createCanvasKitRasterCodec } from '@open-pencil/core/io/formats/raster'
import CanvasKitInit from '@open-pencil/canvaskit'
import { frameNamed } from './engine.js'

const require = createRequire(import.meta.url)
let kit = null

async function canvasKit() {
  if (kit) return kit
  const wasm = require.resolve('@open-pencil/canvaskit/dist/canvaskit.wasm')
  kit = await CanvasKitInit({ locateFile: () => wasm })
  return kit
}

function frameOf(graph, name) {
  const frame = frameNamed(graph, name)
  if (!frame) throw new Error(`没有这屏：${name}`)
  return frame
}

export async function exportScreenHtml(graph, name) {
  const frame = frameOf(graph, name)
  const result = await renderNodesToHTML(graph, [frame.id], { html: 'standalone', style: 'inline', assets: 'inline' })
  return result.html
}

export async function exportScreenTailwind(graph, name) {
  const frame = frameOf(graph, name)
  const result = await renderNodesToHTML(graph, [frame.id], { html: 'standalone', style: 'tailwind', assets: 'inline' })
  return result.html
}

export async function exportScreenJsx(graph, name) {
  const frame = frameOf(graph, name)
  return sceneNodeToJSX(frame.id, graph)
}

export async function exportScreenVue(graph, name) {
  const frame = frameOf(graph, name)
  const result = await renderNodesToHTML(graph, [frame.id], { html: 'fragment', style: 'inline', assets: 'inline' })
  return `<template>\n${result.html}\n</template>\n\n<script setup>\n</script>\n`
}

/** 两张同样尺寸的 PNG 差了百分之几。对不上尺寸时返回 null。 */
export async function comparePngPair(before, after) {
  const codec = createCanvasKitRasterCodec(await canvasKit())
  const result = comparePNGs(codec, before, after, { threshold: 0.1 })
  if (!result || !result.totalPixels) return null
  return { pct: (result.changedPixels / result.totalPixels) * 100, changedPixels: result.changedPixels, totalPixels: result.totalPixels }
}
