import faunadb from 'faunadb'
import { RotateAccessAndRefreshToken, VerifyRefreshToken } from './tokens'

const q = faunadb.query
const { CurrentIdentity, Get } = q

export function RefreshToken() {
  return VerifyRefreshToken(
    {
      tokens: RotateAccessAndRefreshToken(),
      user: Get(CurrentIdentity()),
    },
    'refresh',
  )
}
