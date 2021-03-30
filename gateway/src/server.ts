import WebSocket from 'ws'
import qs from 'qs'
import http from 'http'
import admin from './lib/firebase'
import { PORT } from './constants'
import { RedisEvent, RequestWithUser } from './types'
import { handleEvent } from './handlers'
import { handleUnauthorizedUpgrade } from './util/handleUnauthorizedUpgrade'
import { redisPublisher, redisSubscriber, redisClient } from './lib/redis'
import { deserialize, serialize } from './util/serialization'

export async function startServer() {
  try {
    const connectedUsers = new Map<string, WebSocket>()
    const server = http.createServer()
    const wss = new WebSocket.Server({ clientTracking: false, noServer: true })

    await redisSubscriber.subscribe('events')

    redisSubscriber.on('message', (channel: string, message: string) => {
      if (channel === 'events') {
        const { event, target } = deserialize<RedisEvent>(message)

        const targetSocket = connectedUsers.get(target)
        if (!targetSocket) {
          return
        }

        targetSocket.send(serialize(event))
      }
    })

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
      const { userId } = request
      connectedUsers.set(userId, socket)
      redisClient.set(`u:${userId}`, '')

      socket.on('message', event => {
        handleEvent(event.toString(), socket)
      })

      socket.on('close', () => {
        connectedUsers.delete(userId)
        redisClient.del(`u:${userId}`)
      })
    })

    server.listen(PORT, () => {
      console.log(`Listening on PORT ${PORT}`)
    })
  } catch (error) {
    redisClient.quit()
    redisSubscriber.quit()
    redisPublisher.quit()
  }
}
