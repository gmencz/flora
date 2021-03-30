import WebSocket from 'ws'
import { Opcode } from '../types'
import { serialize } from './serialization'

export function sendOpError(op: Opcode, err: string, socket: WebSocket) {
  return socket.send(serialize({ op, err }))
}
