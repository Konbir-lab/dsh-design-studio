/** 引擎 lint 之外的四条：文字溢出、固定栏压内容、字号不在阶梯上、一行太长。 */
const TYPE_LADDER = [11, 12, 14, 16, 20, 22, 24, 30, 32, 44, 56, 72]

function walk(graph, id, out = []) {
  const node = graph.getNode(id)
  if (!node) return out
  out.push(node)
  for (const child of graph.getChildren(id)) walk(graph, child.id, out)
  return out
}

export function lintFrame(graph, frame) {
  const nodes = walk(graph, frame.id)
  const issues = []
  for (const node of nodes) {
    if (node.type === 'TEXT' && node.derivedTextHeight && node.height && node.derivedTextHeight > node.height + 1) {
      issues.push({ rule: 'overflow', nodeId: node.id, name: node.name })
    }
    if (node.type === 'TEXT' && node.fontSize && !TYPE_LADDER.includes(Math.round(node.fontSize))) {
      issues.push({ rule: 'type-step', nodeId: node.id, name: node.name, fontSize: node.fontSize })
    }
    if (node.type === 'TEXT' && node.width > 320 && /[\u4e00-\u9fff]/.test(node.text || '')) {
      issues.push({ rule: 'line-length', nodeId: node.id, name: node.name, width: node.width })
    }
  }
  const bar = nodes.find((n) => n.layoutPositioning === 'ABSOLUTE' && n.y > frame.height * 0.8)
  if (bar) {
    for (const node of nodes) {
      if (node.id === bar.id || node.layoutPositioning === 'ABSOLUTE') continue
      const bottom = node.y + node.height
      if (bottom > bar.y && node.y < bar.y + bar.height) issues.push({ rule: 'bar-overlap', nodeId: node.id, name: node.name, bar: bar.id })
    }
  }
  return issues
}
