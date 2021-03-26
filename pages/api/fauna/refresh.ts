import { REFRESH_TOKEN_REUSE_ERROR } from '@/fauna/auth/anomalies'
import { AddRateLimiting } from '@/fauna/auth/rateLimiting'
import { REFRESH_TOKEN_LIFETIME_SECONDS } from '@/fauna/auth/tokens'
import { createClient } from '@/lib/FaunaClient'
import { FaunaAuthTokens } from '@/lib/types'
import catchHandler from '@/util/catchHandler'
import setCookie from '@/util/setCookie'
import {
  Call,
  ContainsPath,
  Function,
  If,
  Let,
  Now,
  Select,
  TimeDiff,
  Var,
} from 'faunadb'
import { NextApiRequest, NextApiResponse } from 'next'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const refreshToken = req.cookies.chatskeeFaunaRefresh
  const fauna = createClient(refreshToken)

  let refreshResult: FaunaAuthTokens | null
  try {
    refreshResult = await fauna.query<FaunaAuthTokens | null>(
      AddRateLimiting(
        Let(
          {
            tokens: Call(Function('refresh')),
          },
          If(ContainsPath(['code'], Var('tokens')), null, {
            access: {
              secret: Select(['tokens', 'access', 'secret'], Var('tokens')),
              expInMs: TimeDiff(
                Now(),
                Select(['tokens', 'access', 'ttl'], Var('tokens')),
                'milliseconds',
              ),
            },
            refresh: {
              secret: Select(['tokens', 'refresh', 'secret'], Var('tokens')),
            },
          }),
        ),
      ),
    )
  } catch (error) {
    console.error(`REFRESH ERROR - ${error}`)
    return res.status(error.requestResult?.statusCode ?? 500).json({
      message: error.message ?? 'Oops! Something went wrong',
    })
  }

  if (!refreshResult) {
    setCookie(res, 'chatskeeFaunaRefresh', '', {
      maxAge: -1,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
    return res.status(401).json(REFRESH_TOKEN_REUSE_ERROR)
  }

  const { access, refresh } = refreshResult

  setCookie(res, 'chatskeeFaunaRefresh', refresh.secret, {
    maxAge: REFRESH_TOKEN_LIFETIME_SECONDS,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  return res.json(access)
}

export default catchHandler(handler)
