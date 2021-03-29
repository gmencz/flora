import WebSocket from 'ws'
import { ConnectedUser } from '../types'

export function closeUserSocket(
  connectedUsers: Map<string, ConnectedUser>,
  userId: string,
  socket: WebSocket,
) {
  const connectedUser = connectedUsers.get(userId)
  if (connectedUser) {
    const hasOtherOpenSockets = connectedUser.sockets.size > 1
    if (hasOtherOpenSockets) {
      connectedUser.sockets.delete(socket)
    } else {
      connectedUsers.delete(userId)
    }
  }
}
