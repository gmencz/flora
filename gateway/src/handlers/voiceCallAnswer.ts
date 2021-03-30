import { redisClient } from '../lib/redis'
import { VoiceCallAnswer, EventHandler } from '../types'
import { publishEvent } from '../util/publishEvent'
import { sendOpError } from '../util/sendOpError'

export const handleVoiceCallAnswer: EventHandler = async (
  op,
  data: VoiceCallAnswer,
  socket,
) => {
  const { callerId, answer } = data
  const isCallerOnline = await redisClient.exists(`u:${callerId}`)

  if (!isCallerOnline) {
    return sendOpError(op, 'caller_offline', socket)
  }

  publishEvent({ op, d: answer }, callerId)
}
