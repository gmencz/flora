import WebSocket from 'ws'
import { redisClient } from '../lib/redis'
import { RequestWithUser } from '../types'

export function connectUser(
  request: RequestWithUser,
  socket: WebSocket,
  connectedUsers: Map<string, WebSocket>,
) {
  const { userId } = request
  connectedUsers.set(userId, socket)
  redisClient.set(`u:${userId}`, '')
}

export function disconnectUser(
  request: RequestWithUser,
  connectedUsers: Map<string, WebSocket>,
) {
  const { userId } = request
  connectedUsers.delete(userId)
  redisClient.del(`u:${userId}`)
}
