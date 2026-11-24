/**
 * 把 CSS filter 里的 contrast / brightness / saturate 烘进照片像素。
 * 引擎的图片 filters 用的是 Figma 的单位，对不上 CSS，所以导入和 M0 都走这里。
 * 矩阵按 Filter Effects 规范，函数从左到右作用。颜色和偏移都在 0–1，和 CanvasKit 的颜色矩阵一致。
 */
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

/** 4×5 矩阵相乘，a 作用在 b 之后。偏移在第 5 列，单位 0–1。 */
function multiply(a, b) {
  const out = new Array(20).fill(0)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let sum = 0
      for (let k = 0; k < 4; k++) sum += a[row * 5 + k] * b[k * 5 + col]
      out[row * 5 + col] = sum
    }
    let offset = a[row * 5 + 4]
    for (let k = 0; k < 4; k++) offset += a[row * 5 + k] * b[k * 5 + 4]
    out[row * 5 + 4] = offset
  }
  return out
}

function brightnessMatrix(amount) {
  return [
    amount, 0, 0, 0, 0,
    0, amount, 0, 0, 0,
    0, 0, amount, 0, 0,
    0, 0, 0, 1, 0,
  ]
}

function contrastMatrix(amount) {
  const offset = 0.5 - 0.5 * amount
  return [
    amount, 0, 0, 0, offset,
    0, amount, 0, 0, offset,
    0, 0, amount, 0, offset,
    0, 0, 0, 1, 0,
  ]
}

function saturateMatrix(amount) {
  const r = 0.213, g = 0.715, b = 0.072
  return [
    r + (1 - r) * amount, g - g * amount, b - b * amount, 0, 0,
    r - r * amount, g + (1 - g) * amount, b - b * amount, 0, 0,
    r - r * amount, g - g * amount, b + (1 - b) * amount, 0, 0,
    0, 0, 0, 1, 0,
  ]
}

/**
 * @param {Uint8Array} bytes  JPEG 或 PNG
 * @param {{ contrast?: number, brightness?: number, saturate?: number }} filter  CSS 的系数，1 是不变
 * @returns {Promise<Uint8Array>} PNG
 */
export async function bakeCssFilter(bytes, filter = {}) {
  const ck = await canvasKit()
  const image = ck.MakeImageFromEncoded(bytes)
  if (!image) throw new Error('照片解码失败')
  let matrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]
  if (filter.contrast != null) matrix = multiply(contrastMatrix(filter.contrast), matrix)
  if (filter.brightness != null) matrix = multiply(brightnessMatrix(filter.brightness), matrix)
  if (filter.saturate != null) matrix = multiply(saturateMatrix(filter.saturate), matrix)
  const surface = ck.MakeSurface(image.width(), image.height())
  if (!surface) throw new Error('建不起画布')
  const paint = new ck.Paint()
  const colorFilter = ck.ColorFilter.MakeMatrix(matrix)
  paint.setColorFilter(colorFilter)
  surface.getCanvas().drawImage(image, 0, 0, paint)
  const shot = surface.makeImageSnapshot()
  const png = shot.encodeToBytes(ck.ImageFormat.PNG, 100)
  colorFilter.delete()
  paint.delete()
  shot.delete()
  surface.delete()
  image.delete()
  if (!png) throw new Error('照片编码失败')
  return png
}
