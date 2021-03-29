import WebSocket from 'ws'
import { ConnectedUser, RequestWithUser } from '../types'

export function connectUserSocket(
  request: RequestWithUser,
  connectedUsers: Map<string, ConnectedUser>,
  socket: WebSocket,
) {
  const { userId } = request
  const connectedUser = connectedUsers.get(userId)

  if (connectedUser) {
    connectedUsers.set(userId, {
      sockets: connectedUser.sockets.add(socket),
    })
  } else {
    connectedUsers.set(userId, { sockets: new Set([socket]) })
  }

  return { userId }
}
