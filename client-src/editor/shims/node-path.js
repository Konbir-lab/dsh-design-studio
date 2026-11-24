export function dirname(file) {
  const text = String(file || '')
  const cut = text.replace(/[/\\][^/\\]*$/, '')
  return cut || '.'
}

export function isAbsolute(file) {
  return String(file || '').startsWith('/')
}

export function relative(_from, to) {
  return String(to || '')
}

export function join(...parts) {
  return parts.filter(Boolean).join('/')
}

export function resolve(...parts) {
  return join(...parts)
}

export default { dirname, isAbsolute, relative, join, resolve }
