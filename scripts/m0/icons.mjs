/**
 * 从 block-iron/icons.svg 和首页内联的状态栏 SVG 抽出路径，供 home.jsx 写成 <Vector>。
 * 这些路径写进 JSX 后计入 token。
 */
import fs from 'node:fs'

export function symbols(svg) {
  const out = {}
  for (const match of svg.matchAll(/<symbol id="([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g)) {
    out[match[1]] = [...match[2].matchAll(/\bd="([^"]+)"/g)].map((m) => m[1])
  }
  return out
}

export function loadIcons(file) {
  return symbols(fs.readFileSync(file, 'utf8'))
}

/** 首页状态栏里那三个内联图标，viewBox 各不相同。 */
export const STATUS = {
  signal: { w: 17, h: 11, fill: 'M0 7h3v4H0zM4.5 5h3v6h-3zM9 2.5h3v8.5H9zM13.5 0h3v11h-3z' },
  wifi: { w: 16, h: 11, stroke: 'M1 3.6a10 10 0 0 1 14 0M3.6 6.4a6.4 6.4 0 0 1 8.8 0M6.2 9a2.8 2.8 0 0 1 3.6 0' },
  battery: { w: 25, h: 12, stroke: 'M.7.7h21v10.6a2.6 2.6 0 0 1-2.6 2.6h-18a2.6 2.6 0 0 1-2.6-2.6z', fill: 'M2.4 2.4h15v7.2a1.5 1.5 0 0 1-1.5 1.5h-13.5z' },
}
