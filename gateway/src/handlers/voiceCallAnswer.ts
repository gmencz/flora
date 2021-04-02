import { getUser } from '../lib/redis/user'
import { VoiceCallAnswer, EventHandler } from '../types'
import { publishEventForTarget } from '../util/publishEventForTarget'
import { sendOp } from '../util/sendOp'
import { sendOpError } from '../util/sendOpError'

export const handleVoiceCallAnswer: EventHandler = async (
  op,
  data: VoiceCallAnswer,
  socket,
) => {
  const { callerId } = data
  const isCallerOnline = await getUser(callerId)

  if (!isCallerOnline) {
    return sendOpError(op, 'caller_offline', socket)
  }

  sendOp('voice_call_answer_good', socket)
  publishEventForTarget(op, data, callerId)
}
