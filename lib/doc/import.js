/** 把一个 HTML 文件导成文档里的一屏。多屏各导一次，再存成同一份 design.fig。 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { cloneNodeProps } from '@open-pencil/scene-graph/copy'
import { copyImages } from '@open-pencil/scene-graph/images'
import { readHTMLDocument } from '@open-pencil/core/io/formats/html/import'
import { emptyGraph, framesOf, pageOf, saveProject } from './engine.js'

function adopt(from, to, nodeId, parentId) {
  const src = from.getNode(nodeId)
  if (!src) return null
  const created = to.createNode(src.type, parentId, cloneNodeProps(src, null))
  for (const child of from.getChildren(nodeId)) adopt(from, to, child.id, created.id)
  return created
}

export async function importHtml(graph, file, { width = 390, height = 844 } = {}) {
  const html = fs.readFileSync(file, 'utf8')
  const { graph: source } = await readHTMLDocument(html, {
    baseURL: pathToFileURL(file).href,
    viewport: { width, height },
    framed: true,
    pageName: path.basename(file, path.extname(file)),
  })
  copyImages(source.images, graph.images, source.images.keys())
  const page = pageOf(graph)
  const tops = source.getChildren(source.getPages()[0].id).filter((n) => n.type === 'FRAME')
  const made = []
  for (const top of tops) {
    const node = adopt(source, graph, top.id, page.id)
    if (node) made.push(node)
  }
  return made
}

export async function importDirectory(dir, { width = 390, height = 844 } = {}) {
  const graph = emptyGraph()
  const files = fs.readdirSync(dir).filter((name) => name.endsWith('.html') && !name.startsWith('_') && !name.startsWith('.'))
  files.sort()
  for (const name of files) await importHtml(graph, path.join(dir, name), { width, height })
  const saved = await saveProject(dir, graph, { status: 'imported' })
  return { graph, frames: framesOf(graph), ...saved }
}
