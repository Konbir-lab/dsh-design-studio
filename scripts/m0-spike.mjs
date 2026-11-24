/**
 * M0 生成面门：Design JSX → .fig → PNG@2x，对照 block-iron 的一屏 HTML。
 *   node scripts/m0-spike.mjs --screen home
 *
 * 写出 out/<screen>.png、out/<screen>.import.png、out/<screen>.fig、
 * out/<screen>-compare.png、out/report.json。不过门也照写报告。
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { countTokens } from 'gpt-tokenizer'
import { SceneGraph } from '@open-pencil/scene-graph'
import { renderJSX } from '@open-pencil/core/design-jsx'
import { sceneNodeToJSX } from '@open-pencil/design-jsx'
import { fontManager } from '@open-pencil/core/text'
import { computeImageHash } from '@open-pencil/scene-graph/images'
import { exportFigFile, parseFigFile } from '@open-pencil/core/io/formats/fig'
import { headlessRenderNodes } from '@open-pencil/core/io/formats/raster'
import { readHTMLDocument } from '@open-pencil/core/io/formats/html/import'
import { readBehaviour } from '@open-pencil/scene-graph/behaviours'
import { createBrowser } from '../lib/browser.js'

const ROOT = path.resolve(import.meta.dirname, '..')
const DESIGN = path.resolve(ROOT, '../block-iron')
const VIEW = { w: 390, h: 844, scale: 2 }
const SECTIONS = ['status', 'brand', 'kicker', 'hero', 'hero-2', 'hero-sub', 'stats', 'class-card', 'class-photo', 'checkin', 'member', 'store', 'tabbar']
const FONT_CANDIDATES = [
  '/System/Library/Fonts/PingFang.ttc',
  '/Users/konbir/Library/Application Support/com.electron.lark.font_workaround/PingFang.ttc',
  '/System/Library/PrivateFrameworks/FontServices.framework/Versions/A/Resources/Reserved/PingFangUI.ttc',
  '/System/Library/Fonts/Hiragino Sans GB.ttc',
]

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

function readPng(buf) {
  return PNG.sync.read(buf)
}

function crop(png, w, h) {
  const out = new PNG({ width: w, height: h })
  for (let y = 0; y < h; y++) {
    png.data.copy(out.data, y * w * 4, (y * png.width + 0) * 4, (y * png.width + w) * 4)
  }
  return out
}

/** 像素差按参考图像素计。尺寸对不上的部分算进差异，避免裁切之后看起来过门。 */
function diffAgainst(ref, img) {
  const w = Math.min(ref.width, img.width)
  const h = Math.min(ref.height, img.height)
  const a = crop(ref, w, h)
  const b = crop(img, w, h)
  const out = new PNG({ width: w, height: h })
  const mismatched = pixelmatch(a.data, b.data, out.data, w, h, { threshold: 0.1 })
  const overlap = w * h
  const size = { ref: [ref.width, ref.height], img: [img.width, img.height] }
  return { ratio: overlap ? mismatched / overlap : 1, mismatched, width: w, height: h, size, png: out }
}

function panel(pngs) {
  const h = Math.max(...pngs.map((p) => p.height))
  const w = pngs.reduce((s, p) => s + p.width, 0) + (pngs.length - 1) * 8
  const out = new PNG({ width: w, height: h })
  out.data.fill(20)
  let x = 0
  for (const p of pngs) {
    for (let y = 0; y < p.height; y++) {
      p.data.copy(out.data, (y * w + x) * 4, y * p.width * 4, (y * p.width + p.width) * 4)
    }
    x += p.width + 8
  }
  return out
}

function usedCss(html, appCss, tokensCss) {
  const classes = new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)))
  const elements = new Set([...html.matchAll(/<([a-z0-9]+)/g)].map((m) => m[1]))
  const blocks = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(appCss))) {
    const sel = m[1]
    const names = [...sel.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((x) => x[1])
    const tags = [...sel.matchAll(/(^|[\s>+~])([a-z][a-z0-9]*)/g)].map((x) => x[2])
    const hit = names.some((n) => classes.has(n)) || (names.length === 0 && tags.some((t) => elements.has(t) || t === 'html' || t === 'body'))
    if (hit) blocks.push(m[0])
  }
  const used = new Set([...`${html}\n${blocks.join('\n')}`.matchAll(/var\(\s*(--[\w-]+)/g)].map((x) => x[1]))
  const vars = []
  for (const line of tokensCss.split('\n')) {
    const name = /(--[\w-]+)\s*:/.exec(line)
    if (name && used.has(name[1])) vars.push(line.trim())
  }
  const own = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] || ''
  return `${own}\n${blocks.join('\n')}\n${vars.join('\n')}`
}

function walk(graph, id, out = []) {
  const node = graph.getNode(id)
  if (!node) return out
  out.push(node)
  for (const child of node.childIds || []) walk(graph, child, out)
  return out
}

function byName(nodes, name) {
  return nodes.find((n) => n.name === name)
}

function sceneLines(node) {
  const size = node.fontSize || 16
  const lead = node.lineHeight?.unit === 'PERCENT' ? (node.lineHeight.value / 100) * size
    : node.lineHeight?.unit === 'PIXELS' ? node.lineHeight.value
      : size * 1.35
  if (!lead) return 1
  return Math.max(1, Math.round((node.height || lead) / lead))
}

async function loadCjk() {
  const file = FONT_CANDIDATES.find((p) => fs.existsSync(p))
  if (!file) throw new Error('没有可用的中文字体')
  const data = fs.readFileSync(file)
  const bytes = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  for (const style of ['Regular', 'Medium', 'Semibold', 'Bold', 'Black']) {
    await fontManager.markLoaded('PingFang SC', style, bytes)
  }
  return file
}

async function shoot(htmlPath) {
  const browser = createBrowser()
  if (!browser.available()) throw new Error('找不到 Chrome，无法截参考图')
  try {
    return await browser.withPage({
      url: pathToFileURL(htmlPath).href,
      w: VIEW.w,
      h: VIEW.h,
      scale: VIEW.scale,
    }, async (page) => {
      await page.eval(`Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.complete ? 1 : new Promise((r) => { img.onload = img.onerror = r }))])`)
      const png = await page.shot({ format: 'png' })
      const texts = await page.eval(`(() => {
        const out = []
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        let n
        while ((n = walker.nextNode())) {
          const text = n.textContent.replace(/\\s+/g, ' ').trim()
          if (!text) continue
          const range = document.createRange()
          range.selectNodeContents(n)
          const rows = []
          for (const r of range.getClientRects()) {
            if (r.width < 1 || r.height < 1) continue
            const y = Math.round(r.top)
            if (!rows.some((v) => Math.abs(v - y) < 2)) rows.push(y)
          }
          out.push({ text, lines: rows.length || 1 })
        }
        return out
      })()`)
      const dom = await page.eval(`(() => {
        let n = 0
        const see = (el) => {
          const r = el.getBoundingClientRect()
          if (r.width > 0 && r.height > 0) n++
          for (const c of el.children) see(c)
        }
        see(document.body)
        return { visible: n, scrollHeight: document.documentElement.scrollHeight }
      })()`)
      return { png, texts, dom }
    })
  } finally {
    browser.destroy()
  }
}

function attachPhoto(graph, nodes) {
  const photo = byName(nodes, 'class-photo')
  const file = path.join(DESIGN, 'assets/ai-photo-fitness-01.jpg')
  if (!photo || !fs.existsSync(file)) return false
  const bytes = fs.readFileSync(file)
  const hash = computeImageHash(bytes)
  graph.images.set(hash, bytes)
  graph.updateNode(photo.id, {
    fills: [{
      type: 'IMAGE',
      color: { r: 0, g: 0, b: 0, a: 1 },
      opacity: 1,
      visible: true,
      imageHash: hash,
      imageScaleMode: 'FILL',
      filters: { contrast: 0.14, exposure: -0.18, saturation: -0.08 },
    }],
  })
  return true
}

function dshData(graph, frame) {
  const links = [{ from: 'home', to: 'classes.html' }, { from: 'home', to: 'checkin.html' }]
  const states = ['default']
  graph.updateNode(frame.id, {
    pluginData: [
      ...(frame.pluginData || []),
      { pluginId: 'dsh', key: 'links', value: JSON.stringify(links) },
      { pluginId: 'dsh', key: 'states', value: JSON.stringify(states) },
    ],
  })
  return { links, states }
}

function readDsh(graph) {
  const out = {}
  for (const node of graph.getAllNodes()) {
    for (const entry of node.pluginData || []) {
      if (entry.pluginId !== 'dsh') continue
      out[entry.key] = JSON.parse(entry.value)
    }
  }
  return out
}

function behaviourOf(graph) {
  for (const node of graph.getAllNodes()) {
    const behaviour = readBehaviour(node)
    if (behaviour) return { name: node.name, kind: behaviour.kind }
  }
  return null
}

async function renderPng(graph, id) {
  const page = graph.getPages()[0]
  const bytes = await headlessRenderNodes(graph, page.id, [id], { scale: VIEW.scale, format: 'PNG' })
  if (!bytes) throw new Error('无头渲染没有产出 PNG')
  return Buffer.from(bytes)
}

async function main() {
  const screen = arg('--screen', 'home')
  const htmlPath = path.join(DESIGN, `${screen}.html`)
  const jsxPath = path.join(ROOT, 'scripts/m0', `${screen}.jsx`)
  if (!fs.existsSync(htmlPath)) throw new Error(`没有 ${htmlPath}`)
  if (!fs.existsSync(jsxPath)) throw new Error(`没有 ${jsxPath}`)
  const outDir = path.join(ROOT, 'out')
  fs.mkdirSync(outDir, { recursive: true })

  const report = {
    screen,
    tokens: {},
    nodes: {},
    pixelDiff: {},
    cjkWrap: { mismatches: [] },
    elapsedMs: null,
    arch: {},
    gate: {},
  }

  const fontFile = await loadCjk()
  report.arch.font = fontFile

  const html = fs.readFileSync(htmlPath, 'utf8')
  const appCss = fs.readFileSync(path.join(DESIGN, 'app.css'), 'utf8')
  const tokensCss = fs.readFileSync(path.join(DESIGN, 'tokens.css'), 'utf8')
  const jsx = fs.readFileSync(jsxPath, 'utf8')
  const htmlSlice = usedCss(html, appCss, tokensCss)
  report.tokens.html = countTokens(htmlSlice)
  report.tokens.htmlFull = countTokens(`${html}\n${appCss}\n${tokensCss}`)
  report.tokens.jsx = countTokens(jsx)

  const shot = await shoot(htmlPath)
  const ref = readPng(shot.png)
  fs.writeFileSync(path.join(outDir, `${screen}.ref.png`), shot.png)
  report.nodes.domVisible = shot.dom.visible
  report.nodes.scrollHeight = shot.dom.scrollHeight

  const graph = new SceneGraph()
  const started = Date.now()
  const roots = await renderJSX(graph, jsx)
  const renderedAt = Date.now()
  const home = roots.find((r) => r.name === 'home')
  if (!home) throw new Error('JSX 没有名为 home 的根')
  const nodes = walk(graph, home.id)
  report.arch.photo = attachPhoto(graph, nodes)
  const written = dshData(graph, graph.getNode(home.id))
  const before = behaviourOf(graph)
  const pngStarted = Date.now()
  const png = await renderPng(graph, home.id)
  report.elapsedMs = Date.now() - started
  report.arch.timing = { renderMs: renderedAt - started, pngMs: Date.now() - pngStarted }
  fs.writeFileSync(path.join(outDir, `${screen}.png`), png)
  fs.writeFileSync(path.join(outDir, `${screen}.fig`), await exportFigFile(graph))

  const jsxBack = sceneNodeToJSX(home.id, graph)
  fs.writeFileSync(path.join(outDir, `${screen}.roundtrip.jsx`), jsxBack)
  report.arch.jsxRoundTripTokens = countTokens(jsxBack)
  report.arch.behaviourBefore = before

  const fig = fs.readFileSync(path.join(outDir, `${screen}.fig`))
  const back = await parseFigFile(fig.buffer.slice(fig.byteOffset, fig.byteOffset + fig.byteLength))
  const got = readDsh(back)
  report.arch.pluginData = {
    wrote: written,
    read: got,
    kept: JSON.stringify(got.links) === JSON.stringify(written.links) && JSON.stringify(got.states) === JSON.stringify(written.states),
  }
  report.arch.behaviourAfter = behaviourOf(back)

  const sceneTexts = nodes.filter((n) => n.type === 'TEXT' && n.text)
  report.nodes.scene = nodes.length
  report.nodes.text = sceneTexts.length
  const missing = SECTIONS.filter((name) => !byName(nodes, name))
  const plain = html.replace(/<[^>]+>/g, '').replace(/\s+/g, '')
  const unknown = sceneTexts
    .map((n) => String(n.text).replace(/\s+/g, ''))
    .filter((text) => text && !plain.includes(text) && !/^[\s›▮⌒▭]+$/.test(text))
  report.nodes.missingLayers = missing
  report.nodes.textNotInHtml = unknown

  const norm = (s) => String(s).replace(/\s+/g, ' ').trim()
  for (const node of sceneTexts) {
    const text = norm(node.text)
    if (!text || !/[\u4e00-\u9fff]/.test(text)) continue
    const lines = sceneLines(node)
    const dom = shot.texts.find((t) => norm(t.text) === text)
    const flat = (s) => norm(s).replace(/\s/g, '')
    const joined = shot.texts.filter((t) => flat(text).includes(flat(t.text)) && flat(t.text).length > 1)
    const joinedLines = joined.reduce((sum, t) => sum + t.lines, 0)
    const joinedText = joined.map((t) => flat(t.text)).join('')
    if (dom) {
      if (dom.lines !== lines) report.cjkWrap.mismatches.push({ text, dom: dom.lines, scene: lines })
    } else if (joinedText === flat(text)) {
      if (joinedLines !== lines) report.cjkWrap.mismatches.push({ text, dom: joinedLines, scene: lines })
    } else if (lines > 1) report.cjkWrap.mismatches.push({ text, dom: null, scene: lines })
  }

  const jsxPng = readPng(png)
  const jsxDiff = diffAgainst(ref, jsxPng)
  report.pixelDiff.jsx = { ratio: jsxDiff.ratio, mismatched: jsxDiff.mismatched, size: jsxDiff.size }

  try {
    const imported = await readHTMLDocument(html, {
      baseURL: pathToFileURL(htmlPath).href,
      viewport: { width: VIEW.w, height: VIEW.h },
      framed: true,
      pageName: screen,
    })
    const page = imported.graph.getPages()[0]
    const top = imported.graph.getChildren(page.id).find((n) => n.type !== 'COMPONENT' && n.type !== 'COMPONENT_SET')
    const importPng = await renderPng(imported.graph, top.id)
    fs.writeFileSync(path.join(outDir, `${screen}.import.png`), importPng)
    const importDiff = diffAgainst(ref, readPng(importPng))
    report.pixelDiff.import = { ratio: importDiff.ratio, mismatched: importDiff.mismatched, size: importDiff.size }
    report.nodes.import = walk(imported.graph, top.id).length
    fs.writeFileSync(path.join(outDir, `${screen}-compare.png`), PNG.sync.write(panel([ref, jsxPng, readPng(importPng)])))
  } catch (error) {
    report.pixelDiff.import = { error: String(error && error.stack || error) }
    fs.writeFileSync(path.join(outDir, `${screen}-compare.png`), PNG.sync.write(panel([ref, jsxPng])))
  }

  const ratio = report.tokens.jsx / report.tokens.html
  report.tokens.ratio = ratio
  report.gate = {
    tokens: ratio <= 1.5,
    structure: missing.length === 0 && unknown.length === 0,
    pixels: jsxDiff.ratio < 0.05,
    cjk: report.cjkWrap.mismatches.length === 0,
    elapsed: report.elapsedMs < 5000,
  }
  report.gate.pass = Object.values(report.gate).every(Boolean)
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ gate: report.gate, tokens: report.tokens, pixelDiff: report.pixelDiff, elapsedMs: report.elapsedMs, arch: report.arch, cjk: report.cjkWrap.mismatches.length, missing }, null, 2))
  process.exit(report.gate.pass ? 0 : 2)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
