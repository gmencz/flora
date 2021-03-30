import { getUser } from '../lib/redis/user'
import { NewICECandidate, EventHandler } from '../types'
import { publishEventForTarget } from '../util/publishEventForTarget'
import { sendOpError } from '../util/sendOpError'

export const handleNewICECandidate: EventHandler = async (
  op,
  data: NewICECandidate,
  socket,
) => {
  const { targetId, candidate } = data
  const isTargetOnline = await getUser(targetId)

  if (!isTargetOnline) {
    return sendOpError(op, 'user_offline', socket)
  }

  publishEventForTarget(op, candidate, targetId)
}
