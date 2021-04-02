import WebSocket from 'ws'
import { redisPublisher } from '../lib/redis'
import { RequestWithUser } from '../types'

export function connectUser(
  request: RequestWithUser,
  socket: WebSocket,
  connectedUsers: Map<string, WebSocket>,
) {
  const { userId } = request
  connectedUsers.set(userId, socket)
  redisPublisher.set(`u:${userId}`, '')
}

export function disconnectUser(
  request: RequestWithUser,
  connectedUsers: Map<string, WebSocket>,
) {
  const { userId } = request
  connectedUsers.delete(userId)
  redisPublisher.del(`u:${userId}`)
}
