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
  TimeDiff,
  Update,
  Var,
} from 'faunadb'
import admin from '@/lib/firebase/server'
import catchHandler from '@/util/catchHandler'
import { FaunaAuthTokens } from '@/lib/types/auth'
import { createClient } from '@/lib/FaunaClient'
import {
  CreateAccessAndRefreshToken,
  setRefreshTokenCookie,
} from '@/fauna/mutations/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = createClient(process.env.FAUNADB_SERVER_KEY!)

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
        baseUserData: {
          name,
          uid,
          photoURL: picture,
          email,
        },
      },
      If(
        Exists(Var('match')),
        Let(
          { userRef: Select(['ref'], Get(Var('match'))) },
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
                  expInMs: TimeDiff(
                    Now(),
                    Select(['access', 'ttl'], Var('tokens')),
                    'milliseconds',
                  ),
                },
                refresh: {
                  secret: Select(['refresh', 'secret'], Var('tokens')),
                },
              },
            ),
          ),
        ),

        Do(
          Create(Collection('users'), {
            data: Merge(Var('baseUserData'), { created: Now() }),
          }),
          Let(
            {
              tokens: CreateAccessAndRefreshToken(
                Select(['ref'], Get(Var('match'))),
              ),
            },
            {
              access: {
                secret: Select(['access', 'secret'], Var('tokens')),
                expInMs: TimeDiff(
                  Now(),
                  Select(['access', 'ttl'], Var('tokens')),
                  'milliseconds',
                ),
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

  return res.json(access)
}

export default catchHandler(handler)
