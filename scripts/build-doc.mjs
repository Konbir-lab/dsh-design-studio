/** 挂载前的构建：只读文档页从 client-src 拷到 lib，运行时不再构建。 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const from = path.join(root, 'client-src', 'view', 'index.html')
const toDir = path.join(root, 'lib', 'doccanvas')
fs.mkdirSync(toDir, { recursive: true })
fs.copyFileSync(from, path.join(toDir, 'index.html'))
fs.copyFileSync(from, path.join(root, 'lib', 'doc', 'view.html'))
console.log('doc view built')
