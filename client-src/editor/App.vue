<script setup>
import { reactive } from 'vue'
import { createDefaultEditorState, createEditor } from '@open-pencil/core'
import { SceneGraph } from '@open-pencil/scene-graph'
import { provideEditor } from '@open-pencil/vue'
import CanvasApp from './CanvasApp.vue'

const graph = new SceneGraph()
const page = graph.getPages()[0]
const editor = createEditor({
  graph,
  state: reactive(createDefaultEditorState(page.id)),
})
provideEditor(editor)
</script>

<template>
  <CanvasApp />
</template>

<style>
html, body, #app { height: 100%; margin: 0; }
</style>
