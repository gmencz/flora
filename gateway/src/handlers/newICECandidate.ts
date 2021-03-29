import { NewICECandidate, EventHandler } from '../types'
import { serialize } from '../util/serialization'

export const handleNewICECandidate: EventHandler = (
  op,
  data: NewICECandidate,
  connectedUsers,
  socket,
) => {
  const { targetId } = data
  const target = connectedUsers.get(targetId)

  if (!target) {
    return socket.send(serialize({ code: 'user_offline' }))
  }

  target.sockets.forEach(targetSocket => {
    targetSocket.send(
      serialize({
        op,
        d: { candidate: data.candidate },
      }),
    )
  })
}
