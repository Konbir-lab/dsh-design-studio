/**
 * 文档引擎：打开、渲染 JSX、按节点改、存盘、出图。
 * 进程里第一次出图会加载 wasm，之后同一进程里每屏是几十到几百毫秒。
 */
import fs from 'node:fs'
import { SceneGraph } from '@open-pencil/scene-graph'
import { renderJSX } from '@open-pencil/core/design-jsx'
import { sceneNodeToJSX as toJSX } from '@open-pencil/design-jsx'
import { fontManager } from '@open-pencil/core/text'
import { exportFigFile, parseFigFile } from '@open-pencil/core/io/formats/fig'
import { headlessRenderNodes } from '@open-pencil/core/io/formats/raster'
import { docFile, hashBytes, readManifest, writeManifest, screenKey } from './project.js'

const FONTS = [
  '/System/Library/Fonts/PingFang.ttc',
  '/Users/konbir/Library/Application Support/com.electron.lark.font_workaround/PingFang.ttc',
  '/System/Library/PrivateFrameworks/FontServices.framework/Versions/A/Resources/Reserved/PingFangUI.ttc',
  '/System/Library/Fonts/Hiragino Sans GB.ttc',
]

const PATCHABLE = ['x', 'y', 'width', 'height', 'cornerRadius', 'opacity', 'name', 'visible']

let warm = null
let warming = null
let phase = 'cold'

/** cold 还没加载，loading 正在加载 wasm 和字体，ready 可以出图。 */
export function warmPhase() {
  return phase
}

export function warmup() {
  if (warm) return Promise.resolve(warm)
  if (warming) return warming
  phase = 'loading'
  warming = (async () => {
    const file = FONTS.find((p) => fs.existsSync(p))
    if (file) {
      const data = fs.readFileSync(file)
      const bytes = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      for (const style of ['Regular', 'Medium', 'Semibold', 'Bold', 'Black']) {
        await fontManager.markLoaded('PingFang SC', style, bytes)
      }
    }
    const graph = new SceneGraph()
    const [frame] = await renderJSX(graph, '<Frame name="warm" w={8} h={8} />')
    await headlessRenderNodes(graph, graph.getPages()[0].id, [frame.id], { scale: 1, format: 'PNG' })
    warm = { font: file || '' }
    phase = 'ready'
    return warm
  })().catch((error) => {
    phase = 'cold'
    warming = null
    throw error
  })
  return warming
}

/** 新建一份只有一块空画板的文档。目录里已经有 design.fig 就停下。 */
export async function createBlank(dir, { name = 'home', width = 390, height = 844, kind = 'app' } = {}) {
  const safe = String(name || 'home').replace(/[^\w\u4e00-\u9fff-]+/g, '').slice(0, 40) || 'home'
  const w = Math.max(40, Math.min(2000, Math.round(Number(width) || 390)))
  const h = Math.max(40, Math.min(4000, Math.round(Number(height) || 844)))
  fs.mkdirSync(dir, { recursive: true })
  if (fs.existsSync(docFile(dir))) {
    const error = new Error('这个文件夹里已经有 design.fig')
    error.code = 'exists'
    throw error
  }
  const graph = emptyGraph()
  await renderScreen(graph, `<Frame name="${safe}" w={${w}} h={${h}} flex="col" bg="#111111" />`)
  return saveProject(dir, graph, { kind, status: 'draft' })
}

export function pageOf(graph) {
  const page = graph.getPages()[0]
  if (!page) throw new Error('文档没有页面')
  return page
}

export function framesOf(graph) {
  return graph.getChildren(pageOf(graph).id).filter((n) => n.type === 'FRAME')
}

export function frameNamed(graph, name) {
  return framesOf(graph).find((n) => n.name === name) || null
}

export async function openFig(file) {
  const buf = fs.readFileSync(file)
  return parseFigFile(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
}

export async function saveFig(file, graph) {
  const bytes = Buffer.from(await exportFigFile(graph))
  const tmp = `${file}.${process.pid}.tmp`
  fs.writeFileSync(tmp, bytes)
  fs.renameSync(tmp, file)
  return hashBytes(bytes)
}

/** 用 JSX 写入或替换同名的那一屏。返回新画板和引擎警告。 */
export async function renderScreen(graph, jsx) {
  await warmup()
  const roots = await renderJSX(graph, jsx)
  const frame = roots.find((r) => r.type === 'FRAME')
  if (!frame) throw new Error('JSX 没有画板')
  const node = graph.getNode(frame.id)
  const same = framesOf(graph).filter((n) => n.name === node.name && n.id !== node.id)
  for (const old of same) graph.deleteNode(old.id)
  return { frame: graph.getNode(frame.id), warnings: roots.flatMap((r) => r.warnings || []) }
}

export function patchNode(graph, id, props) {
  const node = graph.getNode(id)
  if (!node) throw new Error(`没有这个节点：${id}`)
  const changes = {}
  for (const [key, value] of Object.entries(props || {})) {
    if (PATCHABLE.includes(key)) changes[key] = value
  }
  if (!Object.keys(changes).length) throw new Error('没有能改的属性')
  graph.updateNode(id, changes)
  return graph.getNode(id)
}

export function queryScreen(graph, name, depth) {
  const frame = frameNamed(graph, name)
  if (!frame) throw new Error(`没有这屏：${name}`)
  return toJSX(frame.id, graph, depth ? { maxDepth: depth } : undefined)
}

export async function renderPng(graph, name, scale = 2) {
  const frame = frameNamed(graph, name)
  if (!frame) throw new Error(`没有这屏：${name}`)
  return renderImage(graph, frame.id, { scale, format: 'PNG' })
}

export async function renderImage(graph, id, { scale = 2, format = 'PNG' } = {}) {
  await warmup()
  const node = graph.getNode(id)
  if (!node) throw new Error(`没有这个节点：${id}`)
  const bytes = await headlessRenderNodes(graph, pageOf(graph).id, [id], { scale, format })
  if (!bytes) throw new Error('出图失败')
  return Buffer.from(bytes)
}

export function emptyGraph() {
  return new SceneGraph()
}

/** 把当前画板写进设计目录的 design.fig 和 manifest.json。 */
export async function saveProject(dir, graph, { kind = 'app', status = 'draft', srcHash = '' } = {}) {
  const docHash = await saveFig(docFile(dir), graph)
  const screens = framesOf(graph).map((frame) => ({
    key: screenKey(frame.id),
    name: frame.name,
    kind,
  }))
  const prev = readManifest(dir) || {}
  writeManifest(dir, { ...prev, screens, kind, srcHash, docHash, status })
  return { docHash, screens }
}
