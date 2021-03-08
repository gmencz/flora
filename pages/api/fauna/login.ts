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
import { createClient } from '@/lib/fauna'
import admin from '@/lib/firebase/server'
import { CreateAccessAndRefreshToken, setRefreshTokenCookie } from '@/lib/auth'

export interface Token {
  secret: string
}

export interface TokenWithTtl extends Token {
  exp: string
}

export interface FaunaAuthTokens {
  access: TokenWithTtl
  refresh: Token
}

export interface FaunaAuthPayload {
  accessToken: string
  accessTokenExp: string
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
  const { access, refresh } = await client.query<FaunaAuthTokens>(
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
              tokens: CreateAccessAndRefreshToken(Var('userRef')),
            },
            {
              access: {
                secret: Select(['access', 'secret'], Var('tokens')),
                exp: ToString(Select(['access', 'ttl'], Var('tokens'))),
              },
              refresh: {
                secret: Select(['refresh', 'secret'], Var('tokens')),
              },
            },
          ),
        ),
        Do(
          Create(Collection('users'), {
            data: Merge(Var('baseUserData'), { created: Now() }),
          }),
          Let(
            {
              tokens: CreateAccessAndRefreshToken(Var('userRef')),
            },
            {
              access: {
                secret: Select(['access', 'secret'], Var('tokens')),
                exp: ToString(Select(['access', 'ttl'], Var('tokens'))),
              },
              refresh: {
                secret: Select(['refresh', 'secret'], Var('tokens')),
              },
            },
          ),
        ),
      ),
    ),
  )

  setRefreshTokenCookie(res, refresh.secret)

  return res.json({ access })
}
