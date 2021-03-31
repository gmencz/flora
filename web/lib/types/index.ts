import firebase from 'firebase'
import { NextApiRequest, NextApiResponse } from 'next'
import { Session } from 'next-iron-session'

export type AuthProvider =
  | firebase.auth.GoogleAuthProvider
  | firebase.auth.GithubAuthProvider

export interface Token {
  secret: string
}

export interface TokenWithTtl extends Token {
  expInMs: number
}

export interface FaunaAuthTokens {
  access: TokenWithTtl
  refresh: Token
}

export interface FaunaAuthPayload {
  accessToken: string
  accessTokenExp: string
}

export interface FaunaAccess {
  secret: string
  interval: NodeJS.Timeout
}

export interface Page<TData> {
  data: TData[]
  before: string | null
  after: string | null
}

export type MaybeError<T> = T & { err?: string }

export interface RequestWithSession extends NextApiRequest {
  session: Session
}

export type WithSessionHandler<T = any> = (
  request: RequestWithSession,
  response: NextApiResponse<T>,
) => void | Promise<void>
