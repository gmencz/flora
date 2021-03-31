import { SESSION_TTL } from '@/util/session'
import {
  Create,
  Exists,
  Expr,
  Get,
  Index,
  Let,
  Match,
  Now,
  Select,
  TimeAdd,
  Tokens,
  Var,
} from 'faunadb'

export interface User {
  id: string
  name: string
  email: string
  photoURL: string
  firebaseUid: string
  created: string
}

export interface AuthResult {
  user: User
  secret: string
}

export function GetUserByUid(uid: string) {
  return Get(Match(Index('users_by_uid'), uid))
}

export function CreateTokenForUser(instance: Expr) {
  return Let(
    {
      token: Create(Tokens(), {
        instance,
        ttl: TimeAdd(Now(), SESSION_TTL + 120, 'seconds'),
      }),
    },
    {
      secret: Select(['secret'], Var('token')),
    },
  )
}

export function CheckIfUserExists(uid: string) {
  return Exists(Match(Index('users_by_uid'), uid))
}
