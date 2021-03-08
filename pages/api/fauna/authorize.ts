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
  ToString,
  Update,
  Var,
} from 'faunadb'
import createClient from '@/lib/faunadb'
import admin from '@/lib/firebase-admin'
import { createAccessAndRefreshTokens } from '@/lib/auth'
import setCookie from '@/util/setCookie'

interface FaunaAuthResult {
  accessToken: string
  accessTokenExp: string
  refreshToken: string
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

  if (!req.headers.authorization.startsWith('Bearer')) {
    return res.status(401).json({
      message: 'Invalid authorization header, must use the Bearer format',
    })
  }

  const [, idToken] = req.headers.authorization.split(' ')

  if (!idToken) {
    return res.status(401).json({
      message: 'Invalid authorization header, missing token',
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
  const {
    accessToken,
    refreshToken,
    accessTokenExp,
  } = await client.query<FaunaAuthResult>(
    Let(
      {
        match: Match(Index('users_by_uid'), uid),
        userRef: Select(['ref'], Get(Var('match'))),
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
          Update(Var('userRef'), {
            data: Var('baseUserData'),
          }),
          Let(
            {
              tokens: createAccessAndRefreshTokens(Var('userRef')),
            },
            {
              accessToken: Select(['accessToken', 'secret'], Var('tokens')),
              refreshToken: Select(['refreshToken', 'secret'], Var('tokens')),
            },
          ),
        ),
        Do(
          Create(Collection('users'), {
            data: Merge(Var('baseUserData'), { created: Now() }),
          }),
          Let(
            {
              tokens: createAccessAndRefreshTokens(Var('userRef')),
              accessToken: Select(['accessToken', 'secret'], Var('tokens')),
            },
            {
              refreshToken: Select(['refreshToken', 'secret'], Var('tokens')),
              accessToken: Select(['secret'], Var('accessToken')),
              accessTokenExp: ToString(Select(['ttl'], Var('accessToken'))),
            },
          ),
        ),
      ),
    ),
  )

  const tenYears = 315569520 * 1000
  setCookie(res, 'chatskeeFaunaToken', refreshToken, {
    maxAge: tenYears,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  return res.json({
    accessToken,
    accessTokenExp,
  })
}
