import {
  clearRefreshTokenCookie,
  REFRESH_TOKEN_REUSE_ERROR,
  setRefreshTokenCookie,
} from '@/fauna/mutations/auth'
import { createClient } from '@/lib/FaunaClient'
import { FaunaAuthTokens } from '@/lib/types/auth'
import catchHandler from '@/util/catchHandler'
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
      Let(
        {
          tokens: Call(Function('refresh')),
        },
        If(ContainsPath(['code'], Var('tokens')), null, {
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
        }),
      ),
    )
  } catch (error) {
    console.error(`REFRESH ERROR - ${error}`)
    return res.status(error.requestResult?.statusCode ?? 500).json({
      message: error.message ?? 'Oops! Something went wrong',
    })
  }

  if (!refreshResult) {
    clearRefreshTokenCookie(res)
    return res.status(401).json(REFRESH_TOKEN_REUSE_ERROR)
  }

  const { access, refresh } = refreshResult

  setRefreshTokenCookie(res, refresh.secret)

  return res.json(access)
}

export default catchHandler(handler)
