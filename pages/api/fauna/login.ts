import { NextApiRequest, NextApiResponse } from 'next'
import {
  Collection,
  Create,
  Do,
  If,
  Let,
  Merge,
  Now,
  Select,
  TimeDiff,
  Update,
  Var,
} from 'faunadb'
import admin from '@/lib/firebase/server'
import { FaunaAuthTokens } from '@/lib/types'
import { createClient } from '@/lib/FaunaClient'
import { CheckIfUserExists, CreateTokensForUser } from '@/fauna/auth/login'
import setCookie from '@/util/setCookie'
import { REFRESH_TOKEN_LIFETIME_SECONDS } from '@/fauna/auth/tokens'
import nc from 'next-connect'
import { authorizeHandler } from '@/util/authorizeHandler'

const handler = nc<NextApiRequest, NextApiResponse>().post(async (req, res) => {
  const client = createClient(process.env.FAUNADB_SERVER_KEY!)

  let user: admin.auth.DecodedIdToken
  try {
    user = await authorizeHandler(req)
  } catch (error) {
    return res.status(401).json({
      message: error.message,
    })
  }

  const { name, uid, picture, email } = user
  const baseUserData = {
    name,
    uid,
    photoURL: picture,
    email,
  }

  const { access, refresh } = await client.query<FaunaAuthTokens>(
    Let(
      {
        baseUserData,
        login: CreateTokensForUser(uid),
      },
      If(
        CheckIfUserExists(uid),

        Do(
          Update(Select(['ref'], Select(['user'], Var('login'))), {
            data: Var('baseUserData'),
          }),

          Let(
            {
              tokens: Select(['tokens'], Var('login')),
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

        Do(
          Create(Collection('users'), {
            data: Merge(Var('baseUserData'), { created: Now() }),
          }),
          Let(
            {
              tokens: Select(['tokens'], Var('login')),
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

  setCookie(res, 'chatskeeFaunaRefresh', refresh.secret, {
    maxAge: REFRESH_TOKEN_LIFETIME_SECONDS,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  return res.json(access)
})

export default handler
