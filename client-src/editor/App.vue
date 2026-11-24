<script setup>
import { onMounted, ref } from 'vue'

const params = new URLSearchParams(location.search)
const id = params.get('id') || ''
const status = ref('正在打开')
const layers = ref([])
const selected = ref(null)
const fields = ref({ name: '', x: 0, y: 0, width: 0, height: 0, cornerRadius: 0 })
const shot = ref('')

function query() {
  return 'id=' + encodeURIComponent(id)
}

async function load() {
  const res = await fetch('../nodes.json?' + query())
  if (!res.ok) { status.value = '没有这一屏'; return }
  const data = await res.json()
  layers.value = data.nodes || []
  shot.value = '../screen.png?' + query() + '&t=' + Date.now()
  status.value = data.name || id
}

function select(layer) {
  selected.value = layer.id
  fields.value = {
    name: layer.name || '',
    x: Math.round(layer.x),
    y: Math.round(layer.y),
    width: Math.round(layer.w),
    height: Math.round(layer.h),
    cornerRadius: 0,
  }
}

async function save() {
  if (!selected.value) return
  const res = await fetch('../patch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: selected.value, props: fields.value }),
  })
  status.value = res.ok ? '已存盘' : '存盘失败'
  if (res.ok) await load()
}

onMounted(load)
</script>

<template>
  <div class="shell">
    <header>
      <button type="button" @click="save">存盘</button>
      <span>{{ status }}</span>
    </header>
    <aside>
      <button v-for="layer in layers" :key="layer.id" type="button" :class="{ on: layer.id === selected }" :style="{ paddingLeft: (8 + (layer.depth || 0) * 12) + 'px' }" @click="select(layer)">{{ layer.name || layer.type }}</button>
    </aside>
    <img v-if="shot" class="canvas" :src="shot" alt="">
    <form class="props" @submit.prevent="save">
      <label>名字 <input v-model="fields.name"></label>
      <label>x <input v-model.number="fields.x" type="number"></label>
      <label>y <input v-model.number="fields.y" type="number"></label>
      <label>宽 <input v-model.number="fields.width" type="number"></label>
      <label>高 <input v-model.number="fields.height" type="number"></label>
      <label>圆角 <input v-model.number="fields.cornerRadius" type="number"></label>
      <button type="submit">存盘</button>
    </form>
  </div>
</template>

<style>
html, body, #app { height: 100%; margin: 0; }
.shell { height: 100%; display: grid; grid-template-columns: 220px 1fr 220px; grid-template-rows: 40px 1fr; background: #111; color: #eee; font: 13px/1.4 -apple-system, sans-serif; }
header { grid-column: 1 / -1; display: flex; gap: 12px; align-items: center; padding: 0 12px; border-bottom: 1px solid #333; }
aside, .props { overflow: auto; }
.props { border-left: 1px solid #333; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
aside button, header button, .props button { background: #222; color: inherit; border: 0; text-align: left; padding: 6px 8px; }
aside button.on { background: #C8FF2E; color: #111; }
.canvas { max-width: 100%; object-fit: contain; }
input { width: 100%; box-sizing: border-box; background: #1a1a1a; color: inherit; border: 1px solid #333; }
</style>
