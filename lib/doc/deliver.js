/**
 * 文档屏的交付：交接包里的 HTML / Tailwind / JSX / Vue，和引擎出的图。
 * Vue 文件是导出的 HTML 放进 template，不是手写的组件树。
 */
import fs from 'node:fs'
import path from 'node:path'
import { renderImage } from './engine.js'
import { exportScreenHtml, exportScreenJsx, exportScreenTailwind, exportScreenVue } from './export.js'
import { roomFor } from './room.js'

/** 文档屏导出成 HTML，给整套演示和远程看用。键是 doc:<frameId>。 */
export async function htmlForScreens(root, screens) {
  const room = await roomFor(root)
  const pages = new Map()
  for (const screen of screens || []) {
    const key = typeof screen === 'string' ? screen : screen.key
    if (!String(key).startsWith('doc:')) continue
    const frame = room.graph.getNode(String(key).slice(4))
    if (!frame) continue
    pages.set(key, await exportScreenHtml(room.graph, frame.name))
  }
  return pages
}

function ensureDir(dir) {
  let st = null
  try { st = fs.lstatSync(dir) } catch { fs.mkdirSync(dir, { recursive: true }); return }
  if (st.isSymbolicLink()) throw new Error(`${dir} 是软链接，先挪走再交接`)
  if (!st.isDirectory()) throw new Error(`${dir} 不是文件夹`)
}

function safe(name) {
  return String(name || 'screen').replace(/[^\w.-]+/g, '-').slice(0, 40) || 'screen'
}

export function blocksOf(graph, frameId) {
  const origin = graph.getAbsolutePosition(frameId)
  const blocks = []
  const walk = (id) => {
    const node = graph.getNode(id)
    if (!node) return
    const at = graph.getAbsolutePosition(id)
    blocks.push({
      d: `${String(node.type || '').toLowerCase()}${node.name ? '#' + node.name : ''}`,
      t: String(node.characters || node.text || '').slice(0, 24),
      x: Math.round(at.x - origin.x),
      y: Math.round(at.y - origin.y),
      w: Math.round(node.width || 0),
      h: Math.round(node.height || 0),
    })
    for (const child of graph.getChildren(id)) walk(child.id)
  }
  walk(frameId)
  return blocks
}

export async function documentShots(graph, screens, { selector = '' } = {}) {
  const shots = []
  const lines = []
  for (const screen of screens) {
    const frame = graph.getNode(String(screen.key).slice(4))
    if (!frame) { lines.push(`${screen.key} 找不到`); continue }
    const target = selector && graph.getNode(selector) ? graph.getNode(selector) : frame
    const jpg = await renderImage(graph, target.id, { scale: 2, format: 'JPG' })
    shots.push({ key: target.name || frame.name, jpg })
    const where = target.id === frame.id ? '' : ` 节点 ${target.name || target.id}`
    lines.push(`图 ${shots.length}：${frame.name} ${Math.round(frame.width)}×${Math.round(frame.height)} 文档出图${where}`)
  }
  return { shots, text: lines.join('\n') }
}

export async function buildDocHandoff({ root, screens, kind = 'app', framework = 'react', dest = '', project = null }) {
  const room = await roomFor(root)
  const graph = room.graph
  const dir = path.join(root, 'handoff')
  const shotDir = path.join(dir, 'shots')
  const exportDir = path.join(dir, 'export')
  ensureDir(dir)
  ensureDir(shotDir)
  ensureDir(exportDir)
  const rows = []
  for (const screen of screens) {
    const frame = graph.getNode(String(screen.key).slice(4))
    if (!frame) { rows.push({ key: screen.key, label: screen.label || screen.key, title: '', shots: [], error: '文档里没有这一屏' }); continue }
    const base = safe(frame.name)
    const files = []
    const notes = []
    const write = async (ext, produce) => {
      try {
        const text = await produce()
        const name = `${base}${ext}`
        fs.writeFileSync(path.join(exportDir, name), text)
        files.push(name)
      } catch (e) {
        notes.push(`${ext} 没导出：${String((e && e.message) || e).slice(0, 120)}`)
      }
    }
    await write('.html', () => exportScreenHtml(graph, frame.name))
    await write('.tailwind.html', () => exportScreenTailwind(graph, frame.name))
    await write('.jsx', () => exportScreenJsx(graph, frame.name))
    await write('.vue', () => exportScreenVue(graph, frame.name))
    let shot = ''
    try {
      const jpg = await renderImage(graph, frame.id, { scale: 2, format: 'JPG' })
      shot = `${base}.jpg`
      fs.writeFileSync(path.join(shotDir, shot), jpg)
    } catch (e) {
      notes.push(`截图没出：${String((e && e.message) || e).slice(0, 120)}`)
    }
    rows.push({
      key: frame.name,
      label: frame.name,
      title: frame.name,
      shots: shot ? [shot] : [],
      files,
      notes,
      error: notes.join('；'),
    })
  }
  const fw = framework === 'same' && project ? project.label : framework
  const lines = [
    `# 交接：${path.basename(root)} → ${fw}`,
    '',
    '> 这份设计的源是 `design.fig`。下面的 HTML、Tailwind、JSX、Vue 是引擎从画板导出的起点，截图用来对照。Vue 文件是导出的 HTML 放进 `<template>`。',
    '',
    '## 做什么',
    '',
    `- 设计目录：\`${root}\`（${rows.length} 屏，${kind}）`,
    `- 做到：\`${dest}\``,
    `- 框架：${fw}`,
    '',
    '## 屏幕和路由',
    '',
    '| 屏 | 导出 | 截图（handoff/shots/） |',
    '| --- | --- | --- |',
  ]
  for (const row of rows) {
    const files = (row.files || []).map((name) => `\`handoff/export/${name}\``).join('、') || (row.error || '—')
    lines.push(`| ${row.label} | ${files} | ${row.shots.join('、') || '—'} |`)
  }
  lines.push('', '## 做法和验收', '')
  lines.push('- 先读 `handoff/export/` 里这一屏的 html 或 jsx，再按目标框架改成项目里的页面。设计变量仍以设计目录里的 `tokens.css` 为准（有的话）。')
  lines.push('- 每做完一屏用 `compare_design` 和文档引擎出的图比。差异降到 3% 以下，或剩下的差别说得出理由，再做下一屏。')
  lines.push('- 设计目录里的 `design.fig` 别改。')
  const md = lines.join('\n') + '\n'
  const file = path.join(dir, 'HANDOFF.md')
  fs.writeFileSync(file, md)
  return { file, dir, md, shots: rows.reduce((sum, row) => sum + row.shots.length, 0), rows }
}
