/**
 * 跨屏流程存在画板的 pluginData 里，预览时读，不改设计本身。
 * dsh.link 是节点 id 到目标画板名，dsh.states 是这一屏的状态，dsh.mock 是绑定的数据文件。
 */
export function readFlow(node) {
  const flow = { link: null, states: [], mock: '' }
  for (const entry of node.pluginData || []) {
    if (entry.pluginId !== 'dsh') continue
    if (entry.key === 'link') flow.link = entry.value
    if (entry.key === 'states') flow.states = JSON.parse(entry.value)
    if (entry.key === 'mock') flow.mock = entry.value
  }
  return flow
}

export function withFlow(node, flow) {
  const rest = (node.pluginData || []).filter((entry) => entry.pluginId !== 'dsh' || !['link', 'states', 'mock'].includes(entry.key))
  const next = [...rest]
  if (flow.link) next.push({ pluginId: 'dsh', key: 'link', value: flow.link })
  if (flow.states) next.push({ pluginId: 'dsh', key: 'states', value: JSON.stringify(flow.states) })
  if (flow.mock) next.push({ pluginId: 'dsh', key: 'mock', value: flow.mock })
  return next
}

/** 预览里点了一个节点：有链接就去那一屏，否则留在原地。 */
export function follow(node, screen) {
  const flow = readFlow(node)
  return flow.link || screen
}
