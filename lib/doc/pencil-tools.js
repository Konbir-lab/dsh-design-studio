/**
 * 把 Pencil 的工具定义挂到 DSH。工具在插件进程里跑，作用在设计目录的文档上。
 * 说明沿用 Pencil 的原文，前面加一句它作用在哪。
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import { CORE_TOOLS } from '@open-pencil/core/tools'
import { FigmaAPI } from '@open-pencil/core/figma-api'
import { emptyGraph, openFig, saveProject, warmup } from './engine.js'
import { docFile } from './project.js'

const { toJsonSchema } = createRequire(import.meta.resolve('@open-pencil/core'))('@valibot/to-json-schema')

const KEEP = ['get_jsx', 'find_nodes', 'get_node', 'describe', 'render', 'update_node', 'set_layout', 'set_fill', 'set_text', 'batch_update', 'delete_nodes']

function parametersOf(tool) {
  try {
    const schema = toJsonSchema(tool.input, { errorMode: 'ignore' })
    return {
      type: 'object',
      additionalProperties: true,
      properties: { dir: { type: 'string', description: '设计目录的绝对路径' }, ...(schema.properties || {}) },
      required: ['dir', ...((schema.required || []).filter((name) => name !== 'dir'))],
    }
  } catch {
    return {
      type: 'object',
      additionalProperties: true,
      properties: { dir: { type: 'string', description: '设计目录的绝对路径' } },
      required: ['dir'],
    }
  }
}

async function graphAt(dir) {
  await warmup()
  const file = docFile(dir)
  return fs.existsSync(file) ? openFig(file) : emptyGraph()
}

export function pencilTools() {
  const byName = new Map(CORE_TOOLS.map((tool) => [tool.name, tool]))
  return KEEP.map((name) => byName.get(name)).filter(Boolean).map((tool) => ({
    name: tool.name,
    description: `作用在右侧设计工作台当前文档上。${tool.description}`,
    parameters: parametersOf(tool),
    async execute(args) {
      const { dir, ...rest } = args
      if (!dir) throw new Error('缺设计目录')
      const graph = await graphAt(dir)
      const api = new FigmaAPI(graph)
      if (tool.loadFonts) await tool.loadFonts(api, rest)
      const result = await tool.execute(api, rest)
      if (tool.mutates) await saveProject(dir, graph, { status: 'edited' })
      const text = typeof result === 'string' ? result : JSON.stringify(result)
      return { text, result }
    },
  }))
}
