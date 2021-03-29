import { IncomingMessage } from 'http'
import WebSocket from 'ws'

export type EventHandler = (
  op: Opcode,
  data: any,
  connectedUsers: Map<string, ConnectedUser>,
  socket: WebSocket,
) => void

export type Opcode = 'call_offer' | 'call_answer' | 'new_ice_candidate'

export interface ConnectedUser {
  sockets: Set<WebSocket>
}

export interface RequestWithUser extends IncomingMessage {
  userId: string
}

// Events
export interface VoiceCallOffer {
  calleeId: string
  offer: {
    type: string
    sdp: string
  }
}

export interface VoiceCallAnswer {
  callerId: string
  answer: {
    type: string
    sdp: string
  }
}

export interface NewICECandidate {
  candidate: any
  targetId: string
}

export interface SocketEvent {
  op: Opcode
  d: VoiceCallOffer | VoiceCallAnswer | NewICECandidate
}
