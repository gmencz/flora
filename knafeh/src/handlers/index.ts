import WebSocket from 'ws'
import { Opcode } from '@chatskee/tahini'
import { ConnectedUser, EventHandler, SocketEvent } from '../types'
import { deserialize } from '../util/serialization'
import { handleVoiceCallOffer } from './voiceCallOffer'
import { handleVoiceCallAnswer } from './voiceCallAnswer'
import { handleNewICECandidate } from './newICECandidate'

const handlers: Record<Opcode, EventHandler> = {
  call_offer: handleVoiceCallOffer,
  call_answer: handleVoiceCallAnswer,
  new_ice_candidate: handleNewICECandidate,
}

export function handleEvent(
  connectedUsers: Map<string, ConnectedUser>,
  socket: WebSocket,
  event: WebSocket.Data,
) {
  const { op, d } = deserialize<SocketEvent>(event.toString())
  return handlers[op](op, d, connectedUsers, socket)
}
