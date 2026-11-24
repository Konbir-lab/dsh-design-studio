/**
 * 文档引擎：建、改、存、读、导出、往返。
 *   node --test test/test-doc-engine.mjs
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyGraph, patchNode, queryScreen, renderPng, renderScreen, saveProject, warmup } from '../lib/doc/engine.js'
import { createRoom } from '../lib/doc/room.js'
import { lintFrame } from '../lib/doc/lint.js'
import { follow, withFlow, readFlow } from '../lib/doc/play.js'
import { exportScreenHtml } from '../lib/doc/export.js'
import { designRenderTool, designPatchTool, designQueryTool } from '../lib/doc/tools.js'
import { docFile, readManifest } from '../lib/doc/project.js'
import { openFig } from '../lib/doc/engine.js'

test('warmup then a screen round-trips through a .fig file', async () => {
  const cold = Date.now()
  await warmup()
  const warmedAt = Date.now()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-doc-'))
  const graph = emptyGraph()
  const started = Date.now()
  const { frame, warnings } = await renderScreen(graph, '<Frame name="home" w={120} h={80} bg="#0E0F11" flex="col"><Text name="title" font="PingFang SC" size={20} color="#F4F5F6">今晚</Text></Frame>')
  assert.equal(warnings.length, 0)
  assert.equal(frame.name, 'home')
  patchNode(graph, frame.id, { cornerRadius: 12 })
  assert.equal(graph.getNode(frame.id).cornerRadius, 12)
  const jsx = queryScreen(graph, 'home', 2)
  assert.match(jsx, /name="home"/)
  const png = await renderPng(graph, 'home', 1)
  assert.ok(png.length > 100)
  const warmMs = Date.now() - started
  await saveProject(dir, graph, { srcHash: 'abc', status: 'draft' })
  const again = await openFig(docFile(dir))
  const back = [...again.getAllNodes()]
  const home = back.find((n) => n.name === 'home')
  assert.ok(home, back.map((n) => n.name).join(','))
  assert.equal(home.cornerRadius, 12)
  const manifest = readManifest(dir)
  assert.equal(manifest.screens.length, 1)
  assert.equal(manifest.screens[0].key, `doc:${frame.id}`)
  assert.equal(manifest.srcHash, 'abc')
  assert.ok(manifest.docHash)
  assert.ok(Date.now() - cold > 0)
  assert.ok(warmedAt - cold < 8000, `cold start ${warmedAt - cold}ms`)
  assert.ok(warmMs < 5000, `warm screen ${warmMs}ms`)
})

test('two writers both land, and the room saves once', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-room-'))
  const graph = emptyGraph()
  await renderScreen(graph, '<Frame name="home" w={40} h={40} />')
  let saves = 0
  const room = createRoom(dir, graph, { wait: 20, save: async () => { saves++ } })
  await room.apply((g) => { g.getNode([...g.getAllNodes()].find((n) => n.name === 'home').id); patchNode(g, [...g.getAllNodes()].find((n) => n.name === 'home').id, { cornerRadius: 4 }) })
  await room.apply((g) => patchNode(g, [...g.getAllNodes()].find((n) => n.name === 'home').id, { cornerRadius: 8 }))
  await room.flush()
  assert.equal([...graph.getAllNodes()].find((n) => n.name === 'home').cornerRadius, 8)
  assert.equal(saves, 1)
})

test('lint flags a type size off the ladder', async () => {
  const graph = emptyGraph()
  const { frame } = await renderScreen(graph, '<Frame name="home" w={200} h={80}><Text name="odd" size={13} color="#111">字</Text></Frame>')
  const issues = lintFrame(graph, frame)
  assert.ok(issues.some((issue) => issue.rule === 'type-step' && issue.name === 'odd'))
})

test('play follows a dsh.link without editing the frame', async () => {
  const graph = emptyGraph()
  const { frame } = await renderScreen(graph, '<Frame name="home" w={20} h={20} />')
  const before = frame.pluginData.length
  graph.updateNode(frame.id, { pluginData: withFlow(frame, { link: 'detail', states: ['paid'], mock: 'mock.json' }) })
  const node = graph.getNode(frame.id)
  assert.deepEqual(readFlow(node), { link: 'detail', states: ['paid'], mock: 'mock.json' })
  assert.equal(follow(node, 'home'), 'detail')
  assert.ok(node.pluginData.length >= before)
})

test('pencil render writes a frame the model can name', async () => {
  const { pencilTools } = await import('../lib/doc/pencil-tools.js')
  const { previewStream } = await import('../lib/doc/stream.js')
  const { checkFrame } = await import('../lib/doc/check.js')
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-pencil-'))
  const render = pencilTools().find((tool) => tool.name === 'render')
  const made = await render.execute({ dir, jsx: '<Frame name="home" w={80} h={40}><Text name="odd" size={13}>字</Text></Frame>' })
  assert.match(made.text, /home/)
  const stream = previewStream()
  const snap = stream.push('<Frame name="a" w={10} h={10} />')
  assert.equal(String(snap.tree.type).toLowerCase(), 'frame')
  const graph = await openFig(docFile(dir))
  const frame = [...graph.getAllNodes()].find((node) => node.name === 'home')
  const checked = checkFrame(graph, frame)
  assert.ok(checked.extra.some((issue) => issue.rule === 'type-step'))
})
test('export writes html and the tools round-trip a patch', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-tool-'))
  const rendered = await designRenderTool.execute({ dir, jsx: '<Frame name="home" w={80} h={40} bg="#fff"><Text name="t" size={14}>你好</Text></Frame>' })
  assert.match(rendered.text, /home/)
  const queried = await designQueryTool.execute({ dir, screen: 'home', depth: 2 })
  assert.match(queried.jsx, /home/)
  await designPatchTool.execute({ dir, nodeId: rendered.nodeId, props: { cornerRadius: 6 } })
  const graph = emptyGraph()
  const { frame } = await renderScreen(graph, '<Frame name="card" w={60} h={30} />')
  const html = await exportScreenHtml(graph, 'card')
  assert.match(html, /<html/i)
  assert.equal(frame.name, 'card')
})
