/**
 * 一个文档一个房间。人和模型改的是同一份场景图。
 * 能合并的是节点上的位置、尺寸、圆角、透明度、名字和可见性，记在 Yjs 里。
 * 新增或删除图层仍由服务端这份场景图决定，落盘的只有服务端。
 */
import fs from 'node:fs'
import path from 'node:path'
import * as Y from 'yjs'
import { docFile } from './project.js'
import { emptyGraph, openFig, patchNode, saveProject, warmup } from './engine.js'

const FIELDS = ['x', 'y', 'width', 'height', 'cornerRadius', 'opacity', 'name', 'visible']
const openRooms = new Map()

function nodesOf(graph) {
  return [...graph.getAllNodes()]
}

export function createRoom(dir, graph, { wait = 1000, save = (g) => saveProject(dir, g, { status: 'editing' }) } = {}) {
  const doc = new Y.Doc()
  const props = doc.getMap('props')
  const mirrored = new Map()
  const peers = new Set()
  let pending = Promise.resolve()
  let timer = null
  let dirty = false
  let retired = false
  let applyingRemote = false
  const propKey = (id, key) => `${id}\0${key}`

  function writeDiff(origin) {
    doc.transact(() => {
      for (const node of nodesOf(graph)) {
        const snap = {}
        for (const key of FIELDS) if (node[key] !== undefined) snap[key] = node[key]
        const prev = mirrored.get(node.id) || {}
        const changed = FIELDS.filter((key) => snap[key] !== undefined && prev[key] !== snap[key])
        if (mirrored.has(node.id) && !changed.length) continue
        for (const key of changed) props.set(propKey(node.id, key), snap[key])
        mirrored.set(node.id, snap)
      }
    }, origin)
  }

  function pull() {
    applyingRemote = true
    try {
      const grouped = new Map()
      props.forEach((value, key) => {
        const split = key.indexOf('\0')
        if (split < 0) return
        const id = key.slice(0, split)
        const field = key.slice(split + 1)
        if (!FIELDS.includes(field) || !graph.getNode(id)) return
        if (!grouped.has(id)) grouped.set(id, {})
        grouped.get(id)[field] = value
      })
      for (const [id, incoming] of grouped) {
        const current = graph.getNode(id)
        const diff = {}
        for (const [key, value] of Object.entries(incoming)) if (current[key] !== value) diff[key] = value
        if (Object.keys(diff).length) patchNode(graph, id, diff)
        const snap = {}
        const node = graph.getNode(id)
        for (const key of FIELDS) if (node[key] !== undefined) snap[key] = node[key]
        mirrored.set(id, snap)
      }
    } finally {
      applyingRemote = false
    }
  }

  doc.on('update', (update, origin) => {
    if (origin !== 'local') {
      try { pull() } catch { /* 这一笔合并不进场景图 */ }
    }
    dirty = true
    touch()
    for (const send of peers) {
      try { send(update) } catch { /* 连接已经断了 */ }
    }
  })

  for (const node of nodesOf(graph)) {
    const snap = {}
    for (const key of FIELDS) if (node[key] !== undefined) snap[key] = node[key]
    mirrored.set(node.id, snap)
  }

  function apply(change) {
    const run = pending.then(async () => {
      await change(graph)
      if (!applyingRemote) writeDiff('local')
      dirty = true
    })
    pending = run.catch(() => {})
    return run
  }

  function flush() {
    clearTimeout(timer)
    timer = null
    if (retired || !dirty) return pending
    dirty = false
    const run = pending.then(() => save(graph))
    pending = run.then(() => {}).catch(() => {})
    return run
  }

  function touch() {
    clearTimeout(timer)
    timer = setTimeout(() => { flush().catch(() => {}) }, wait)
  }

  return {
    graph,
    doc,
    apply(change) {
      const run = apply(change)
      touch()
      return run
    },
    flush,
    connect(send) {
      peers.add(send)
      try { send(Y.encodeStateAsUpdate(doc)) } catch { /* 刚连上就断了 */ }
      return () => peers.delete(send)
    },
    receive(update) {
      Y.applyUpdate(doc, update, 'remote')
    },
    retire() {
      retired = true
      clearTimeout(timer)
    },
  }
}

/** 编辑页整份存回 design.fig 之后，换掉内存里的那份，旧房间不再落盘。 */
export async function reloadRoom(dir) {
  const key = path.resolve(dir)
  const current = openRooms.get(key)
  if (current) current.retire()
  await warmup()
  const file = docFile(key)
  const graph = fs.existsSync(file) ? await openFig(file) : emptyGraph()
  await saveProject(key, graph, { status: 'editing' })
  const room = createRoom(key, graph)
  openRooms.set(key, room)
  return room
}

export async function roomFor(dir) {
  const key = path.resolve(dir)
  if (openRooms.has(key)) return openRooms.get(key)
  await warmup()
  const file = docFile(key)
  const graph = fs.existsSync(file) ? await openFig(file) : emptyGraph()
  const room = createRoom(key, graph)
  openRooms.set(key, room)
  return room
}
