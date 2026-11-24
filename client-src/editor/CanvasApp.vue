<script setup>
import { computed, onErrorCaptured, onMounted, ref } from 'vue'
import { exportFigFile, parseFigFile } from '@open-pencil/core/io/formats/fig'
import { CanvasRoot, CanvasSurface } from '@open-pencil/vue/canvas'
import { useEditor } from '@open-pencil/vue'
import { LayerTreeItem, LayerTreeRoot } from '@open-pencil/vue/primitives/LayerTree'
import { ToolbarRoot } from '@open-pencil/vue/primitives/Toolbar'
import { usePosition } from '@open-pencil/vue/controls/position'
import { useVariables } from '@open-pencil/vue/variables'

const editor = useEditor()
const params = new URLSearchParams(location.search)
const focusId = params.get('id') || ''
const status = ref('正在加载绘图引擎')
const saving = ref(false)

onErrorCaptured((error) => {
  status.value = error && error.message ? error.message : '画布出错'
  return false
})

const position = usePosition()
const variables = useVariables()
const selectedName = computed(() => (position.node.value && position.node.value.name) || '未选中')

function numberOf(key) {
  const value = position.panelProp(key).value
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && typeof value.value === 'number') return value.value
  return ''
}

function setNumber(key, raw) {
  const next = Number(raw)
  if (!Number.isFinite(next)) return
  position.commitProp(key, next, Number(numberOf(key)) || 0)
}

const fillHex = computed(() => {
  const node = position.node.value
  const color = node && node.fills && node.fills[0] && node.fills[0].color
  if (!color) return '#888888'
  const channel = (value) => Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 255).toString(16).padStart(2, '0')
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`
})

function setFill(hex) {
  const node = position.node.value
  if (!node) return
  const color = {
    r: Number.parseInt(hex.slice(1, 3), 16) / 255,
    g: Number.parseInt(hex.slice(3, 5), 16) / 255,
    b: Number.parseInt(hex.slice(5, 7), 16) / 255,
    a: 1,
  }
  const current = Array.isArray(node.fills) ? node.fills : []
  const fills = current.length ? current.map((fill, index) => (index === 0 ? { ...fill, type: 'SOLID', color, visible: true } : fill)) : [{ type: 'SOLID', color, opacity: 1, visible: true }]
  editor.graph.updateNode(node.id, { fills })
}

function toolLabel(tool) {
  return tool.label || tool.name || tool.tool || tool.id || tool
}

function toolId(tool) {
  return tool.tool || tool.id || tool
}

onMounted(async () => {
  for (let i = 0; i < 50; i++) {
    let phase = 'loading'
    try { phase = (await (await fetch('../status')).json()).phase } catch { phase = 'loading' }
    if (phase === 'ready') break
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  status.value = '正在打开文档'
  try {
    const res = await fetch('/design.fig')
    if (!res.ok) throw new Error('没有 design.fig')
    const loaded = await parseFigFile(await res.arrayBuffer())
    editor.replaceGraph(loaded)
    if (focusId && loaded.getNode(focusId)) editor.select([focusId])
    editor.zoomToFit()
    status.value = '画布'
  } catch (error) {
    status.value = error.message || '文档没打开'
  }
})

async function save() {
  saving.value = true
  try {
    const bytes = await exportFigFile(editor.graph)
    const res = await fetch('../fig', { method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: bytes })
    status.value = res.ok ? '已存盘' : '存盘失败'
  } catch (error) {
    status.value = error.message || '存盘失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="shell">
    <header>
      <button type="button" :disabled="saving" @click="save">存盘</button>
      <span>{{ status }}</span>
      <span class="name">{{ selectedName }}</span>
    </header>
    <LayerTreeRoot class="layers" v-slot="tree">
      <LayerTreeItem v-for="row in tree.visibleRows" :key="row.node.id" :node="row.node" :level="row.level" :has-children="row.hasChildren" v-slot="item">
        <button type="button" class="layer" :class="{ on: item.isSelected }" :style="{ paddingLeft: item.padLeft }" @click="item.actions.select(false)">{{ item.node.name || item.node.type }}</button>
      </LayerTreeItem>
    </LayerTreeRoot>
    <div class="stage">
      <CanvasRoot class="canvas" @ready="editor.zoomToFit()">
        <CanvasSurface class="surface" />
      </CanvasRoot>
      <ToolbarRoot class="tools" v-slot="bar">
        <button v-for="tool in (bar.tools || [])" :key="toolId(tool)" type="button" :class="{ on: bar.activeTool === toolId(tool) }" @click="bar.actions.setTool(toolId(tool))">{{ toolLabel(tool) }}</button>
      </ToolbarRoot>
    </div>
    <form class="props" @submit.prevent="save">
      <label>x <input :value="numberOf('x')" type="number" @change="setNumber('x', $event.target.value)"></label>
      <label>y <input :value="numberOf('y')" type="number" @change="setNumber('y', $event.target.value)"></label>
      <label>宽 <input :value="numberOf('width')" type="number" @change="setNumber('width', $event.target.value)"></label>
      <label>高 <input :value="numberOf('height')" type="number" @change="setNumber('height', $event.target.value)"></label>
      <label>填色 <input :value="fillHex" type="color" @input="setFill($event.target.value)"></label>
      <div class="vars">
        <button type="button" @click="variables.addVariable('COLOR')">加颜色变量</button>
        <p v-for="item in variables.variables.value" :key="item.id">{{ item.name }}</p>
      </div>
    </form>
  </div>
</template>

<style>
.shell { height: 100%; display: grid; grid-template-columns: 220px 1fr 240px; grid-template-rows: 40px 1fr; background: #111; color: #eee; font: 13px/1.4 -apple-system, sans-serif; }
header { grid-column: 1 / -1; display: flex; gap: 12px; align-items: center; padding: 0 12px; border-bottom: 1px solid #333; }
.layers, .props { overflow: auto; background: #161616; }
.stage { position: relative; min-width: 0; min-height: 0; background: #1b1b1b; }
.canvas, .surface { position: absolute; inset: 0; }
.tools { position: absolute; left: 12px; bottom: 12px; display: flex; flex-wrap: wrap; gap: 4px; max-width: calc(100% - 24px); z-index: 2; }
.props { display: flex; flex-direction: column; gap: 8px; padding: 12px; border-left: 1px solid #333; }
.layer, button { background: #222; color: inherit; border: 1px solid #333; text-align: left; }
.layer.on, button.on { background: #C8FF2E; color: #111; }
.layer { display: block; width: 100%; }
input { width: 100%; box-sizing: border-box; background: #1a1a1a; color: inherit; border: 1px solid #333; }
.name { margin-left: auto; color: #aaa; }
.vars p { margin: 4px 0; }
</style>
