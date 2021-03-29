import { VoiceCallAnswer, EventHandler } from '../types'
import { serialize } from '../util/serialization'

export const handleVoiceCallAnswer: EventHandler = (
  op,
  data: VoiceCallAnswer,
  connectedUsers,
  socket,
) => {
  const { callerId, answer } = data
  const caller = connectedUsers.get(callerId)

  if (!caller) {
    return socket.send(serialize({ code: 'user_offline' }))
  }

  caller.sockets.forEach(callerSocket => {
    callerSocket.send(serialize({ op, d: { answer } }))
  })
}
