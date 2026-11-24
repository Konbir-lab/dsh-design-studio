/** 模型用的三个文档工具。读写都是 Design JSX，小改走节点 id。 */
import fs from 'node:fs'
import { emptyGraph, frameNamed, openFig, patchNode, queryScreen, renderScreen, saveProject } from './engine.js'
import { docFile } from './project.js'

const schema = (properties, required) => ({
  type: 'object',
  additionalProperties: false,
  properties,
  required,
})

async function graphOf(dir) {
  const file = docFile(dir)
  if (!fs.existsSync(file)) return emptyGraph()
  return openFig(file)
}

export const designRenderTool = {
  name: 'design_render',
  description: '把一屏 Design JSX 写进设计目录的 design.fig。同名画板会被替换。返回节点 id 和引擎警告。',
  parameters: schema({
    dir: { type: 'string', description: '设计目录的绝对路径' },
    jsx: { type: 'string', description: '这一屏的 Design JSX，要有一个带 name 的 Frame' },
  }, ['dir', 'jsx']),
  async execute(args) {
    const graph = await graphOf(args.dir)
    const { frame, warnings } = await renderScreen(graph, args.jsx)
    const saved = await saveProject(args.dir, graph, { status: 'rendered' })
    return { text: `已写入 ${frame.name}（${frame.id}）。${warnings.join(' ')}`, nodeId: frame.id, name: frame.name, warnings, docHash: saved.docHash }
  },
}

export const designPatchTool = {
  name: 'design_patch',
  description: '按节点 id 改文档里的一个属性（位置、尺寸、圆角、透明度、名字）。改完存盘。',
  parameters: schema({
    dir: { type: 'string', description: '设计目录的绝对路径' },
    nodeId: { type: 'string', description: '节点 id' },
    props: { type: 'object', description: '要改的属性，如 { "cornerRadius": 12 }' },
  }, ['dir', 'nodeId', 'props']),
  async execute(args) {
    const graph = await graphOf(args.dir)
    const node = patchNode(graph, args.nodeId, args.props)
    const saved = await saveProject(args.dir, graph, { status: 'patched' })
    return { text: `已改 ${node.name}（${node.id}）。`, nodeId: node.id, docHash: saved.docHash }
  },
}

export const designQueryTool = {
  name: 'design_query',
  description: '读回一屏的 Design JSX。depth 限制展开层数，避免一次读回太多 token。',
  parameters: schema({
    dir: { type: 'string', description: '设计目录的绝对路径' },
    screen: { type: 'string', description: '画板名字' },
    depth: { type: 'number', description: '展开几层，不填就全部' },
  }, ['dir', 'screen']),
  async execute(args) {
    const graph = await graphOf(args.dir)
    const frame = frameNamed(graph, args.screen)
    const jsx = queryScreen(graph, args.screen, args.depth)
    return { text: jsx, nodeId: frame && frame.id, jsx }
  },
}
