/**
 * 文档房间：两个人改不同的属性都能留下，WebSocket 上的修改会进同一份场景图。
 *   node --test test/test-doc-edit.mjs
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import * as Y from 'yjs'
import { createHub } from '../lib/serve.js'
import { emptyGraph, patchNode, renderScreen, saveProject } from '../lib/doc/engine.js'
import { createRoom, roomFor } from '../lib/doc/room.js'

function homeId(graph) {
  const node = [...graph.getAllNodes()].find((item) => item.name === 'home')
  assert.ok(node)
  return node.id
}

test('two rooms keep both a radius edit and a position edit', async () => {
  const dirA = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-room-a-'))
  const dirB = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-room-b-'))
  const graph = emptyGraph()
  await renderScreen(graph, '<Frame name="home" w={40} h={40} />')
  await saveProject(dirA, graph)
  await saveProject(dirB, graph)
  const a = await roomFor(dirA)
  const b = await roomFor(dirB)
  const id = homeId(a.graph)
  assert.equal(homeId(b.graph), id)
  await a.apply((g) => patchNode(g, id, { cornerRadius: 4 }))
  await b.apply((g) => patchNode(g, id, { x: 12 }))
  b.receive(Y.encodeStateAsUpdate(a.doc))
  a.receive(Y.encodeStateAsUpdate(b.doc))
  assert.equal(a.graph.getNode(id).cornerRadius, 4)
  assert.equal(a.graph.getNode(id).x, 12)
  assert.equal(b.graph.getNode(id).cornerRadius, 4)
  assert.equal(b.graph.getNode(id).x, 12)
  await a.flush()
  await b.flush()
})

test('a websocket client edit lands on the server graph', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-room-ws-'))
  const graph = emptyGraph()
  await renderScreen(graph, '<Frame name="home" w={40} h={40} />')
  await saveProject(dir, graph)
  const room = await roomFor(dir)
  const id = homeId(room.graph)
  await room.apply((g) => patchNode(g, id, { cornerRadius: 4 }))
  const hub = createHub()
  const opened = await hub.open({ kind: 'file', root: dir })
  const local = new Y.Doc()
  let sent = false
  const ws = new WebSocket(opened.origin.replace(/^http/, 'ws') + '/__dsh_design__/doc/room')
  ws.binaryType = 'arraybuffer'
  local.on('update', (update, origin) => {
    if (origin === 'remote' || ws.readyState !== WebSocket.OPEN) return
    ws.send(update)
  })
  ws.onmessage = (event) => {
    Y.applyUpdate(local, new Uint8Array(event.data), 'remote')
    if (sent) return
    const props = local.getMap('props')
    if (![...props.keys()].some((key) => key.startsWith(`${id}\0`))) return
    sent = true
    local.transact(() => { props.set(`${id}\0x`, 21) })
  }
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('websocket edit did not land')), 8000)
      const watch = setInterval(() => {
        if (room.graph.getNode(id).x === 21) {
          clearInterval(watch)
          clearTimeout(timer)
          resolve()
        }
      }, 50)
      ws.onerror = () => { clearTimeout(timer); clearInterval(watch); reject(new Error('websocket failed')) }
    })
    assert.equal(room.graph.getNode(id).cornerRadius, 4)
    assert.equal(room.graph.getNode(id).x, 21)
    await room.flush()
  } finally {
    ws.close()
    hub.close(`file:${path.resolve(dir)}`)
  }
})

test('one room still saves a single time after two local edits', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-room-once-'))
  const graph = emptyGraph()
  await renderScreen(graph, '<Frame name="home" w={30} h={30} />')
  let saves = 0
  const room = createRoom(dir, graph, { wait: 30, save: async () => { saves++ } })
  const id = homeId(graph)
  await room.apply((g) => patchNode(g, id, { cornerRadius: 4 }))
  await room.apply((g) => patchNode(g, id, { cornerRadius: 8 }))
  await room.flush()
  assert.equal(graph.getNode(id).cornerRadius, 8)
  assert.equal(saves, 1)
})
