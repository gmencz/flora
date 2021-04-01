import { VoiceCallEnded, EventHandler } from '../types'
import { publishEventForTarget } from '../util/publishEventForTarget'

export const handleVoiceCallEnded: EventHandler = async (
  op,
  data: VoiceCallEnded,
) => {
  publishEventForTarget(op, 1, data.otherPeerId)
}
