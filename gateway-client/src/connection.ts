import WebSocket from 'isomorphic-ws'
import ReconnectingWebSocket from 'reconnecting-websocket'

const healthCheckInterval = 8000
const connectionTimeout = 15000
const baseUrl =
  process.env.NODE_ENV === 'production'
    ? 'wss://gateway.gabrielmendezc.com/'
    : 'ws://localhost:9999/'

export type Token = string

export type ListenerHandler<Data = unknown> = (data: Data) => void

export type Listener<Data = unknown> = {
  opcode: string
  handler: ListenerHandler<Data>
}

export interface Connection {
  close: () => void
  once: <Data = unknown>(opcode: string, handler: ListenerHandler<Data>) => void
  send: (opcode: string, data: unknown) => void
  addListener: <Data>(
    opcode: string,
    handler: ListenerHandler<Data>,
  ) => () => void
}

export const connect = (token: Token): Promise<Connection> => {
  return new Promise((resolve, reject) => {
    const socket = new ReconnectingWebSocket(`${baseUrl}?token=${token}`, [], {
      connectionTimeout,
      WebSocket,
    })

    const send = (opcode: string, data: unknown) => {
      const raw = `{"op":"${opcode}","d":${JSON.stringify(data)}}`
      socket.send(raw)
    }

    const listeners: Listener[] = []

    socket.addEventListener('open', () => {
      const healthCheck = setInterval(() => {
        socket.send('ping')
      }, healthCheckInterval)

      socket.addEventListener('close', error => {
        clearInterval(healthCheck)
        socket.close()
        reject(error)
      })

      socket.addEventListener('message', event => {
        // We ignore "pong" events because we only use them
        // for health checks.
        if (event.data === 'pong') {
          return
        }

        const message = JSON.parse(event.data)

        listeners
          .filter(({ opcode }) => opcode === message.op)
          .forEach(it => it.handler(message.err ? message : message.d))
      })

      const connection: Connection = {
        close: () => socket.close(),
        once: (opcode, handler) => {
          const listener = { opcode, handler } as Listener<unknown>

          listener.handler = (...params) => {
            handler(...(params as Parameters<typeof handler>))
            listeners.splice(listeners.indexOf(listener), 1)
          }

          listeners.push(listener)
        },
        send,
        addListener: (opcode, handler) => {
          const listener = { opcode, handler } as Listener<unknown>

          listeners.push(listener)

          return () => listeners.splice(listeners.indexOf(listener), 1)
        },
      }

      resolve(connection)
    })
  })
}
