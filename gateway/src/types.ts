import { IncomingMessage } from 'http'
import WebSocket from 'ws'

export type Opcode =
  | 'voice_call_offer'
  | 'voice_call_answer'
  | 'new_ice_candidate'

export type EventHandler = (op: Opcode, data: any, socket: WebSocket) => void

export interface RequestWithUser extends IncomingMessage {
  userId: string
}

// Events
export interface VoiceCallOffer {
  callerId: string
  calleeId: string
  offer: any // RTC Session description
}

export interface VoiceCallAnswer {
  callerId: string
  calleeId: string
  answer: any // RTC Session description
}

export interface NewICECandidate {
  candidate: any
  targetId: string
}

export interface SocketEvent {
  op: Opcode
  d: VoiceCallOffer | VoiceCallAnswer | NewICECandidate
}

export interface RedisEvent {
  event: SocketEvent
  target: string
}
