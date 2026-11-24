/**
 * 文档屏出口：HTML / JSX / Vue，引擎出图，同一张图差异低于 3%。
 *   node --test test/test-doc-export.mjs
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createBlank, emptyGraph, renderImage, renderScreen, saveProject, warmPhase, warmup } from '../lib/doc/engine.js'
import { listScreens, parseTarget, urlFor } from '../lib/core.js'
import { comparePngPair, exportScreenHtml, exportScreenJsx, exportScreenVue } from '../lib/doc/export.js'
import { buildDocHandoff, documentShots } from '../lib/doc/deliver.js'
import { ladderFromCss, lintFrame } from '../lib/doc/lint.js'
import { markBoxes } from '../lib/doc/mark.js'
import { htmlForScreens } from '../lib/doc/deliver.js'
import { buildPack } from '../lib/htmlpack.js'

test('exports html, jsx and vue, and an identical render stays under 3%', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-export-'))
  const graph = emptyGraph()
  const { frame } = await renderScreen(graph, '<Frame name="home" w={48} h={32} bg="#111111"><Text name="title" size={13} color="#ffffff">你好</Text></Frame>')
  await saveProject(dir, graph)
  const html = await exportScreenHtml(graph, 'home')
  const jsx = await exportScreenJsx(graph, 'home')
  const vue = await exportScreenVue(graph, 'home')
  assert.match(html, /<html/i)
  assert.match(jsx, /home/)
  assert.match(vue, /<template>/)
  assert.match(vue, /<script setup>/)
  const png = await renderImage(graph, frame.id, { scale: 1, format: 'PNG' })
  const same = await comparePngPair(png, png)
  assert.ok(same)
  assert.ok(same.pct < 3, `same pixels ${same.pct}`)
  const other = emptyGraph()
  const made = await renderScreen(other, '<Frame name="home" w={48} h={32} bg="#ffffff" />')
  const diff = await comparePngPair(png, await renderImage(other, made.frame.id, { scale: 1, format: 'PNG' }))
  assert.ok(diff.pct > 3, `different pixels ${diff.pct}`)
  const shot = await documentShots(graph, [{ key: `doc:${frame.id}` }])
  assert.equal(shot.shots.length, 1)
  assert.equal(shot.shots[0].jpg[0], 0xff)
  assert.equal(shot.shots[0].jpg[1], 0xd8)
  const handoff = await buildDocHandoff({ root: dir, screens: [{ key: `doc:${frame.id}` }], framework: 'vue', dest: path.join(dir, '..', 'out-app') })
  assert.match(handoff.md, /3%/)
  assert.match(handoff.md, /handoff\/export\//)
  assert.deepEqual(handoff.rows[0].notes, [])
  assert.ok(fs.existsSync(path.join(dir, 'handoff', 'export', 'home.html')))
  assert.ok(fs.existsSync(path.join(dir, 'handoff', 'export', 'home.tailwind.html')))
  assert.ok(fs.existsSync(path.join(dir, 'handoff', 'export', 'home.jsx')))
  assert.ok(fs.existsSync(path.join(dir, 'handoff', 'export', 'home.vue')))
  assert.equal(handoff.shots, 1)
})

test('a red box marks the node, and the exported page can be packed', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-mark-'))
  const graph = emptyGraph()
  const { frame } = await renderScreen(graph, '<Frame name="home" w={40} h={24} bg="#111111"><Text name="title" size={14} color="#ffffff">字</Text></Frame>')
  await saveProject(dir, graph)
  const png = await renderImage(graph, frame.id, { scale: 1, format: 'PNG' })
  const jpg = await markBoxes(png, [{ x: 2, y: 2, w: 20, h: 12 }], 1)
  assert.equal(jpg[0], 0xff)
  assert.equal(jpg[1], 0xd8)
  const pages = await htmlForScreens(dir, [{ key: `doc:${frame.id}` }])
  const packed = buildPack({
    screens: [{ key: `doc:${frame.id}`, label: 'home' }],
    read: (rel) => pages.has(rel) ? Buffer.from(pages.get(rel)) : null,
    kind: 'app',
    w: 40,
    h: 24,
  })
  assert.equal(packed.count, 1)
  assert.match(packed.html, /home/)
})

test('a blank document opens as a doc screen', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-blank-'))
  const project = path.join(dir, 'untitled')
  const made = await createBlank(project, { name: 'home', width: 390, height: 844 })
  assert.equal(made.screens.length, 1)
  assert.equal(made.screens[0].name, 'home')
  const target = parseTarget(project)
  assert.equal(target.root, project)
  assert.equal(path.basename(target.file), 'design.fig')
  assert.ok(listScreens(project)[0].startsWith('doc:'))
  assert.match(urlFor(target, 'http://127.0.0.1:9'), /__dsh_design__\/doc\/\?id=/)
  await warmup()
  assert.equal(warmPhase(), 'ready')
})

test('a token size is on the ladder', () => {
  const graph = emptyGraph()
  return renderScreen(graph, '<Frame name="home" w={80} h={40}><Text name="odd" size={13}>字</Text></Frame>').then(({ frame }) => {
    assert.ok(lintFrame(graph, frame).some((issue) => issue.rule === 'type-step'))
    assert.ok(ladderFromCss('--font-body: 13px;').includes(13))
    assert.equal(lintFrame(graph, frame, '--font-body: 13px;').some((issue) => issue.rule === 'type-step'), false)
  })
})
