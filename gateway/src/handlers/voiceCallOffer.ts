import { getUser } from '../lib/redis/user'
import { VoiceCallOffer, EventHandler } from '../types'
import { publishEventForTarget } from '../util/publishEventForTarget'
import { sendOpError } from '../util/sendOpError'

export const handleVoiceCallOffer: EventHandler = async (
  op,
  data: VoiceCallOffer,
  socket,
) => {
  const { calleeId } = data
  const isCalleeOnline = await getUser(calleeId)

  if (!isCalleeOnline) {
    return sendOpError(op, 'callee_offline', socket)
  }

  publishEventForTarget(op, data, calleeId)
}
