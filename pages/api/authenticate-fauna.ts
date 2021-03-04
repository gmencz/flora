import { NextApiRequest, NextApiResponse } from 'next'
import {
  Collection,
  Create,
  Do,
  Exists,
  Get,
  If,
  Index,
  Let,
  Match,
  Merge,
  Now,
  Select,
  Tokens,
  Update,
  Var,
} from 'faunadb'
import createClient from '@/lib/faunadb'
import setCookie from '@/util/setCookie'
import admin from '@/lib/firebase-admin'

interface FaunaAuthResult {
  secret: string
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const client = createClient()

  if (!req.headers.authorization) {
    return res.status(401).json({
      message: 'Missing authorization header',
    })
  }

  const [, idToken] = req.headers.authorization.split(' ')

  if (!idToken) {
    return res.status(401).json({
      message: 'Invalid authorization header',
    })
  }

  let user: admin.auth.DecodedIdToken
  try {
    user = await admin.auth().verifyIdToken(idToken)
  } catch (error) {
    console.error(error)
    return res.status(401).json({
      message: 'Invalid ID token',
    })
  }

  const { name, uid, picture, email } = user
  const { secret } = await client.query<FaunaAuthResult>(
    Let(
      {
        match: Match(Index('users_by_uid'), uid),
        baseUserData: {
          name,
          uid,
          photoURL: picture,
          email,
        },
      },
      If(
        Exists(Var('match')),
        Do(
          Update(Select(['ref'], Get(Var('match'))), {
            data: Var('baseUserData'),
          }),
          Create(Tokens(), {
            instance: Select(['ref'], Get(Var('match'))),
          }),
        ),
        Do(
          Create(Collection('users'), {
            data: Merge(Var('baseUserData'), { created: Now() }),
          }),
          Create(Tokens(), {
            instance: Select(['ref'], Get(Var('match'))),
          }),
        ),
      ),
    ),
  )

  const tenYears = 315569520 * 1000
  setCookie(res, 'chatskeeFaunaToken', secret, {
    maxAge: tenYears,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  return res.json({
    ok: true,
  })
}
