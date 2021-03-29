import { IncomingMessage } from 'http'
import WebSocket from 'ws'
import { Opcode } from '@chatskee/tahini'

export type EventHandler = (
  op: Opcode,
  data: any,
  connectedUsers: Map<string, ConnectedUser>,
  socket: WebSocket,
) => void

export interface ConnectedUser {
  sockets: Set<WebSocket>
}

export interface RequestWithUser extends IncomingMessage {
  userId: string
}

// Events
export interface VoiceCallOffer {
  calleeId: string
  offer: any // RTC Session description
}

export interface VoiceCallAnswer {
  callerId: string
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
