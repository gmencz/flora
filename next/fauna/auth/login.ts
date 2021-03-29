import faunadb from 'faunadb'
import { CreateAccessAndRefreshToken } from './tokens'

const q = faunadb.query
const { Let, Var, Select, Match, Index, Get, Exists } = q

function GetUserByUid(uid: string) {
  return Get(Match(Index('users_by_uid'), uid))
}

export function CheckIfUserExists(uid: string) {
  return Exists(Match(Index('users_by_uid'), uid))
}

export function CreateTokensForUser(uid: string) {
  return Let(
    {
      user: GetUserByUid(uid),
      userRef: Select(['ref'], Var('user')),
      tokens: CreateAccessAndRefreshToken(Var('userRef')),
    },
    {
      tokens: Var('tokens'),
      user: Var('user'),
    },
  )
}
