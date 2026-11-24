/**
 * 一个文档一个房间。服务端是唯一落盘的人：人和模型的修改排成一队，停一秒再存。
 * 真正的 Yjs 合并留在 scripts/build-collab.mjs，从 open-pencil 的 d549281 打包；
 * 这一层保证同一进程里两边的修改都按顺序落上，不会互相覆盖。
 */
import { saveProject } from './engine.js'

export function createRoom(dir, graph, { wait = 1000, save = (g) => saveProject(dir, g, { status: 'editing' }) } = {}) {
  let pending = Promise.resolve()
  let timer = null
  let dirty = false

  function apply(change) {
    const run = pending.then(async () => {
      change(graph)
      dirty = true
    })
    pending = run.catch(() => {})
    return run
  }

  function flush() {
    clearTimeout(timer)
    timer = null
    if (!dirty) return pending
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
    apply(change) {
      const run = apply(change)
      touch()
      return run
    },
    flush,
  }
}
