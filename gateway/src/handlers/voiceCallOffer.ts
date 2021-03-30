import { redisClient } from '../lib/redis'
import { VoiceCallOffer, EventHandler } from '../types'
import { publishEvent } from '../util/publishEvent'
import { sendOpError } from '../util/sendOpError'

export const handleVoiceCallOffer: EventHandler = async (
  op,
  data: VoiceCallOffer,
  socket,
) => {
  const { calleeId, offer } = data
  const isCalleeId = await redisClient.exists(`u:${calleeId}`)

  if (!isCalleeId) {
    return sendOpError(op, 'callee_offline', socket)
  }

  publishEvent({ op, d: offer }, calleeId)
}
