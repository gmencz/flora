import {
  clearRefreshTokenCookie,
  REFRESH_TOKEN_REUSE_ERROR,
  setRefreshTokenCookie,
} from '@/lib/auth'
import { createClient } from '@/lib/fauna'
import catchHandler from '@/util/catchHandler'
import {
  Call,
  ContainsPath,
  Function,
  If,
  Let,
  Select,
  ToString,
  Var,
} from 'faunadb'
import { NextApiRequest, NextApiResponse } from 'next'
import { FaunaAuthTokens } from './login'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const refreshToken = req.cookies.chatskeeFaunaRefresh
  const fauna = createClient(refreshToken)

  let refreshResult: FaunaAuthTokens | null
  try {
    refreshResult = await fauna.query<FaunaAuthTokens | null>(
      Let(
        {
          refreshResult: Call(Function('refresh')),
        },
        If(
          ContainsPath(['code'], Var('refreshResult')),
          null,
          Let(
            {
              tokens: Select(['tokens'], Var('refreshResult')),
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

  return res.json({ access })
}

export default catchHandler(handler)
