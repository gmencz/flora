import WebSocket from 'ws'
import { Opcode } from '../types'
import { EventHandler, SocketEvent } from '../types'
import { deserialize } from '../util/serialization'
import { handleVoiceCallOffer } from './voiceCallOffer'
import { handleVoiceCallAnswer } from './voiceCallAnswer'
import { handleNewICECandidate } from './newICECandidate'
import { handleVoiceCallEnded } from './voiceCallEnded'
import { sendOpError } from '../util/sendOpError'

const handlers: Record<Opcode, EventHandler> = {
  voice_call_offer: handleVoiceCallOffer,
  voice_call_answer: handleVoiceCallAnswer,
  new_ice_candidate: handleNewICECandidate,
  voice_call_ended: handleVoiceCallEnded,
}

export function handleEvent(event: string, socket: WebSocket) {
  if (event === 'ping') {
    return socket.send('pong')
  }

  const { op, d } = deserialize<SocketEvent>(event)
  const opHandler = handlers[op]

  if (!opHandler) {
    return sendOpError(op, 'handler_not_implemented', socket)
  }

  return handlers[op](op, d, socket)
}
