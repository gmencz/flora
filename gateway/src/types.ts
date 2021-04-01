import { IncomingMessage } from 'http'
import WebSocket from 'ws'

export type Opcode =
  | 'voice_call_offer'
  | 'voice_call_answer'
  | 'new_ice_candidate'
  | 'voice_call_ended'

export type EventHandler = (op: Opcode, data: any, socket: WebSocket) => void

export interface RequestWithUser extends IncomingMessage {
  userId: string
}

// Events
export interface VoiceCallOffer {
  callerId: string
  calleeId: string
  dm: string
  offer: any // RTC Session description
}

export interface VoiceCallAnswer {
  callerId: string
  calleeId: string
  dm: string
  answer: any // RTC Session description
}

export interface NewICECandidate {
  candidate: any
  targetId: string
}

export interface VoiceCallEnded {
  otherPeerId: string
}

export interface SocketEvent {
  op: Opcode
  d: VoiceCallOffer | VoiceCallAnswer | NewICECandidate | VoiceCallEnded
}

export interface RedisEvent {
  event: SocketEvent
  target: string
}
