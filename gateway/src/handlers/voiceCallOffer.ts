import { getUser } from '../lib/redis/user'
import { VoiceCallOffer, EventHandler } from '../types'
import { publishEventForTarget } from '../util/publishEventForTarget'
import { sendOp } from '../util/sendOp'
import { sendOpError } from '../util/sendOpError'

export const handleVoiceCallOffer: EventHandler = async (
  op,
  data: VoiceCallOffer,
  socket,
) => {
  const { calleeId } = data
  const isCalleeOnline = await getUser(calleeId)

  if (!isCalleeOnline) {
    return sendOpError(op, 'user_offline', socket)
  }

  sendOp('voice_call_offer_good', socket)
  publishEventForTarget(op, data, calleeId)
}
