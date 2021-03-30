import http from 'http'
import WebSocket from 'ws'
import { PORT } from './constants'
import { RequestWithUser } from './types'
import { handleEvent } from './handlers'
import { initRedisPubsub } from './util/initRedisPubsub'
import { authorizeUser } from './util/authorizeUser'
import { connectUser, disconnectUser } from './util/connection'

const connectedUsers = new Map<string, WebSocket>()
export async function startServer() {
  const server = http.createServer()
  const wss = new WebSocket.Server({ clientTracking: false, noServer: true })
  await initRedisPubsub(connectedUsers)

  server.on('upgrade', async (request, socket, head) => {
    try {
      await authorizeUser(request, socket)
    } catch (error) {
      socket.destroy()
    }

    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request)
    })
  })

  wss.on('connection', async (socket, request: RequestWithUser) => {
    connectUser(request, socket, connectedUsers)

    socket.on('message', event => handleEvent(event.toString(), socket))
    socket.on('close', () => disconnectUser(request, connectedUsers))
  })

  server.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`)
  })
}
