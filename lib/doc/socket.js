/** 预览端口上的 WebSocket。只收发二进制帧，给 Yjs 房间用。 */
import crypto from 'node:crypto'

const MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

function frame(opcode, payload) {
  const body = Buffer.from(payload)
  let head
  if (body.length < 126) head = Buffer.from([0x80 | opcode, body.length])
  else if (body.length < 65536) {
    head = Buffer.alloc(4)
    head[0] = 0x80 | opcode
    head[1] = 126
    head.writeUInt16BE(body.length, 2)
  } else {
    head = Buffer.alloc(10)
    head[0] = 0x80 | opcode
    head[1] = 127
    head.writeBigUInt64BE(BigInt(body.length), 2)
  }
  return Buffer.concat([head, body])
}

/** 握手并返回 send(bytes)。onBinary 收到客户端的一帧。 */
export function acceptWebSocket(req, socket, head, { onBinary }) {
  const key = req.headers['sec-websocket-key']
  if (!key) {
    socket.destroy()
    return () => {}
  }
  const accept = crypto.createHash('sha1').update(String(key) + MAGIC).digest('base64')
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`)
  let buf = Buffer.from(head && head.length ? head : [])
  const send = (data) => {
    if (socket.destroyed) return
    socket.write(frame(0x2, data))
  }
  const consume = () => {
    while (buf.length >= 2) {
      const opcode = buf[0] & 0x0f
      const masked = (buf[1] & 0x80) !== 0
      let len = buf[1] & 0x7f
      let off = 2
      if (len === 126) {
        if (buf.length < 4) return
        len = buf.readUInt16BE(2)
        off = 4
      } else if (len === 127) {
        if (buf.length < 10) return
        if (buf.readUInt32BE(2) !== 0) { socket.destroy(); return }
        len = buf.readUInt32BE(6)
        off = 10
      }
      const maskLen = masked ? 4 : 0
      if (buf.length < off + maskLen + len) return
      const payload = Buffer.alloc(len)
      if (masked) {
        const mask = buf.subarray(off, off + 4)
        const data = buf.subarray(off + 4, off + 4 + len)
        for (let i = 0; i < len; i++) payload[i] = data[i] ^ mask[i & 3]
      } else buf.copy(payload, 0, off, off + len)
      buf = buf.subarray(off + maskLen + len)
      if (opcode === 0x8) { socket.end(); return }
      if (opcode === 0x9) { socket.write(frame(0xA, payload)); continue }
      if (opcode === 0x2 && onBinary) onBinary(payload)
    }
  }
  socket.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk])
    consume()
  })
  consume()
  return send
}
