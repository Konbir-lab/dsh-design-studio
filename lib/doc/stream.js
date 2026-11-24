/** 模型写 JSX 的过程中，把已经写完的部分变成一棵可以预览的树。 */
import { createStreamingJSXParser } from '@open-pencil/design-jsx'

export function previewStream() {
  const parser = createStreamingJSXParser()
  return {
    push(chunk) {
      const snap = parser.append(chunk)
      return { tree: snap.tree, pending: snap.pending.length }
    },
    reset() { parser.reset() },
  }
}
