import { getUser } from '../lib/redis/user'
import { VoiceCallOffer, EventHandler } from '../types'
import { publishEventForTarget } from '../util/publishEventForTarget'
import { sendOpError } from '../util/sendOpError'

export const handleVoiceCallOffer: EventHandler = async (
  op,
  data: VoiceCallOffer,
  socket,
) => {
  const { calleeId, callerId, offer } = data
  const isCalleeId = await getUser(calleeId)

  if (!isCalleeId) {
    return sendOpError(op, 'callee_offline', socket)
  }

  publishEventForTarget(op, { calleeId, callerId, offer }, calleeId)
}
