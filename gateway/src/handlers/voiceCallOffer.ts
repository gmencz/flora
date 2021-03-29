import { VoiceCallOffer, EventHandler } from '../types'
import { serialize } from '../util/serialization'

export const handleVoiceCallOffer: EventHandler = (
  op,
  data: VoiceCallOffer,
  connectedUsers,
  socket,
) => {
  const { calleeId, offer } = data
  const callee = connectedUsers.get(calleeId)

  if (!callee) {
    return socket.send(serialize({ code: 'user_offline' }))
  }

  callee.sockets.forEach(calleeSocket => {
    calleeSocket.send(serialize({ op, d: { offer } }))
  })
}
