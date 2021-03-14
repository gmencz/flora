import { Page } from './common'

export interface DirectMessageUser {
  id: string
  name: string
  photo: string
}

export interface DirectMessage {
  timestamp: string
  nonce: string
  content: string
  status: DirectMessageStatus
  user: DirectMessageUser
}

export interface DirectMessageDetails {
  currentUser: DirectMessageUser
  withUser: DirectMessageUser
  messages: Page<DirectMessage>
}

export enum DirectMessageStatus {
  FAILED,
  IN_QUEUE,
  DELIVERED,
}

export type NewMessage = Pick<DirectMessage, 'content' | 'nonce'>
