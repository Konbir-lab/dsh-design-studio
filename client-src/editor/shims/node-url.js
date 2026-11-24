export function fileURLToPath(url) {
  return decodeURIComponent(String(url).replace(/^file:\/\//, ''))
}

export function pathToFileURL(file) {
  return new URL(`file://${file}`)
}

export default { fileURLToPath, pathToFileURL }
