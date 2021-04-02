import WebSocket from 'ws'
import { serialize } from './serialization'

export function sendOp(op: string, socket: WebSocket, data: any = 1) {
  return socket.send(serialize({ op, d: data }))
}
