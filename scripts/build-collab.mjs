/**
 * 从 Konbir-lab/open-pencil 的 0.17.0（d549281）打包 @open-pencil/collab。
 * 这个包没有发到 npm。打包结果放到 vendor/collab/index.js，房间层再换成它。
 * 现在房间用顺序队列保证同一进程里的修改都落盘。
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const pin = 'd549281fd47d43ee3ad01b15c066bb3d41cf5cb3'
const dest = path.join(root, 'vendor', 'open-pencil')
const clone = spawnSync('git', ['clone', '--filter=blob:none', 'git@github.com:Konbir-lab/open-pencil.git', dest], { stdio: 'inherit' })
if (clone.status !== 0) process.exit(clone.status || 1)
const checkout = spawnSync('git', ['checkout', pin], { cwd: dest, stdio: 'inherit' })
process.exit(checkout.status || 0)
