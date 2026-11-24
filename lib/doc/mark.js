/** 在引擎出的图上画红框，标出体检点到的节点。坐标是画板里的 CSS 像素，scale 是出图倍率。 */
import { createRequire } from 'node:module'
import CanvasKitInit from '@open-pencil/canvaskit'

const require = createRequire(import.meta.url)
let kit = null

async function canvasKit() {
  if (kit) return kit
  const wasm = require.resolve('@open-pencil/canvaskit/dist/canvaskit.wasm')
  kit = await CanvasKitInit({ locateFile: () => wasm })
  return kit
}

export async function markBoxes(png, boxes, scale = 1) {
  const ck = await canvasKit()
  const image = ck.MakeImageFromEncoded(png)
  if (!image) throw new Error('图解码失败')
  const surface = ck.MakeSurface(image.width(), image.height())
  if (!surface) throw new Error('建不起画布')
  const canvas = surface.getCanvas()
  canvas.drawImage(image, 0, 0)
  const paint = new ck.Paint()
  paint.setStyle(ck.PaintStyle.Stroke)
  paint.setStrokeWidth(Math.max(2, scale * 2))
  paint.setColor(ck.Color(232, 56, 47, 255))
  paint.setAntiAlias(true)
  for (const box of (boxes || []).slice(0, 8)) {
    const x = box.x * scale
    const y = box.y * scale
    const w = Math.max(1, box.w * scale)
    const h = Math.max(1, box.h * scale)
    canvas.drawRect(ck.LTRBRect(x, y, x + w, y + h), paint)
  }
  const shot = surface.makeImageSnapshot()
  const jpg = shot.encodeToBytes(ck.ImageFormat.JPEG, 84)
  paint.delete()
  shot.delete()
  surface.delete()
  image.delete()
  if (!jpg) throw new Error('红框编码失败')
  return Buffer.from(jpg)
}
