import { getUser } from '../lib/redis/user'
import { VoiceCallAnswer, EventHandler } from '../types'
import { publishEventForTarget } from '../util/publishEventForTarget'
import { sendOpError } from '../util/sendOpError'

export const handleVoiceCallAnswer: EventHandler = async (
  op,
  data: VoiceCallAnswer,
  socket,
) => {
  const { callerId, calleeId, answer } = data
  const isCallerOnline = await getUser(callerId)

  if (!isCallerOnline) {
    return sendOpError(op, 'caller_offline', socket)
  }

  publishEventForTarget(op, { calleeId, callerId, answer }, callerId)
}
