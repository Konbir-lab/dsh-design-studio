/** 文档屏的体检：Pencil 的 lint，加上我们的四条。每条都带 nodeId。 */
import { createLinter } from '@open-pencil/core/lint'
import { lintFrame } from './lint.js'

export function checkFrame(graph, frame, css = '') {
  const engine = createLinter({ preset: 'recommended' }).lintGraph(graph, [frame.id])
  const ours = lintFrame(graph, frame, css)
  const messages = (engine.messages || engine.results || []).map((message) => ({
    rule: message.ruleId || message.rule || 'engine',
    nodeId: message.nodeId || (message.node && message.node.id) || '',
    name: message.node && message.node.name || '',
  }))
  return { engine: messages, extra: ours }
}
