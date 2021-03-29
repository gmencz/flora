if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' })
}

import WebSocket from 'ws'
import qs from 'qs'
import http from 'http'
import admin from './lib/firebase'
import { PORT } from './constants'
import { ConnectedUser, RequestWithUser } from './types'
import { handleEvent } from './handlers'
import { closeUserSocket } from './util/closeUserSocket'
import { connectUserSocket } from './util/connectUserSocket'
import { handleUnauthorizedUpgrade } from './util/handleUnauthorizedUpgrade'

// If there are performance issues we will use memcached or redis
// instead of an in-memory Map to track the connected users.
const connectedUsers = new Map<string, ConnectedUser>()

const server = http.createServer()
const wss = new WebSocket.Server({ clientTracking: false, noServer: true })

// User must authenticate before establishing a connection
// with the WebSocket server.
server.on('upgrade', async (request, socket, head) => {
  const url = request.url.substr(2)
  const { token } = qs.parse(url)

  if (!token) {
    return handleUnauthorizedUpgrade(socket)
  }

  try {
    const { uid } = await admin.auth().verifyIdToken(token as string)
    request.userId = uid
  } catch (error) {
    console.error(error)
    return handleUnauthorizedUpgrade(socket)
  }

  wss.handleUpgrade(request, socket, head, ws => {
    wss.emit('connection', ws, request)
  })
})

wss.on('connection', async (socket, request: RequestWithUser) => {
  const { userId } = connectUserSocket(request, connectedUsers, socket)

  socket.on('message', event => {
    if (event === 'ping') {
      return socket.send('pong')
    }

    return handleEvent(connectedUsers, socket, event)
  })

  socket.on('close', () => {
    return closeUserSocket(connectedUsers, userId, socket)
  })
})

server.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`)
})
