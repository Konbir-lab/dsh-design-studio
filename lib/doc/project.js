/** 设计目录里的文档：design.fig 是一份文档，manifest.json 记下每一屏。 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const DOC_FILE = 'design.fig'
export const MANIFEST_FILE = 'manifest.json'

export function docFile(dir) {
  return path.join(dir, DOC_FILE)
}

export function hashBytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex')
}

export function readManifest(dir) {
  try {
    const raw = fs.readFileSync(path.join(dir, MANIFEST_FILE), 'utf8')
    const data = JSON.parse(raw)
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

export function writeManifest(dir, manifest) {
  const file = path.join(dir, MANIFEST_FILE)
  const tmp = `${file}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2))
  fs.renameSync(tmp, file)
}

/** 画布和工具用的屏 key。没有文档清单时是空的，HTML 目录不受影响。 */
export function docScreenKeys(dir) {
  const manifest = readManifest(dir)
  if (!manifest || !Array.isArray(manifest.screens)) return []
  return manifest.screens.map((s) => s && s.key).filter((k) => typeof k === 'string' && k.startsWith('doc:'))
}

export function screenKey(frameId) {
  return `doc:${frameId}`
}
