import WebSocket from 'ws'
import { Opcode } from '@chatskee/gateway'
import { EventHandler, SocketEvent } from '../types'
import { deserialize } from '../util/serialization'
import { handleVoiceCallOffer } from './voiceCallOffer'
import { handleVoiceCallAnswer } from './voiceCallAnswer'
import { handleNewICECandidate } from './newICECandidate'

const handlers: Record<Opcode, EventHandler> = {
  voice_call_offer: handleVoiceCallOffer,
  voice_call_answer: handleVoiceCallAnswer,
  new_ice_candidate: handleNewICECandidate,
}

export function handleEvent(event: string, socket: WebSocket) {
  if (event === 'ping') {
    return socket.send('pong')
  }

  const { op, d } = deserialize<SocketEvent>(event)
  return handlers[op](op, d, socket)
}
