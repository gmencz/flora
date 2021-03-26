import firebase from 'firebase'

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
