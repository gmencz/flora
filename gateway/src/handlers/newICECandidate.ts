import { redisClient } from '../lib/redis'
import { NewICECandidate, EventHandler } from '../types'
import { publishEvent } from '../util/publishEvent'
import { sendOpError } from '../util/sendOpError'

export const handleNewICECandidate: EventHandler = async (
  op,
  data: NewICECandidate,
  socket,
) => {
  const { targetId, candidate } = data
  const isTargetOnline = await redisClient.exists(`u:${targetId}`)

  if (!isTargetOnline) {
    return sendOpError(op, 'user_offline', socket)
  }

  publishEvent({ op, d: candidate }, targetId)
}
