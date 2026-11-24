/** 文档屏的出口：一屏导出成 HTML。代码交接用这份，而不是让模型重写。 */
import { renderNodesToHTML } from '@open-pencil/core/io/formats/html'
import { frameNamed } from './engine.js'

export async function exportScreenHtml(graph, name) {
  const frame = frameNamed(graph, name)
  if (!frame) throw new Error(`没有这屏：${name}`)
  const result = await renderNodesToHTML(graph, [frame.id], { html: 'standalone', style: 'inline', assets: 'inline' })
  return result.html
}
