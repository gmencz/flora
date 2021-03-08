import { createClient } from '@/lib/fauna'
import catchHandler from '@/util/catchHandler'
import { createAccessToken } from '@/lib/auth'
import { CurrentToken, Get, Let, Select, ToString, Var } from 'faunadb'
import { NextApiRequest, NextApiResponse } from 'next'

export interface FaunaRefreshResult {
  accessToken: string
  exp: string
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const refreshToken = req.cookies.chatskeeFaunaToken
  if (!refreshToken) {
    return res.status(403).json({ message: 'Missing refresh token' })
  }

  const client = createClient(refreshToken)

  let refreshResult: FaunaRefreshResult
  try {
    refreshResult = await client.query<FaunaRefreshResult>(
      Let(
        {
          currentToken: CurrentToken(),
          session: Select(
            ['ref'],
            Get(Select(['instance'], Get(Var('currentToken')))),
          ),
          userRef: Select(['data', 'user'], Get(Var('session'))),
          accessToken: createAccessToken(Var('userRef'), Var('currentToken')),
        },
        {
          exp: ToString(Select(['ttl'], Var('accessToken'))),
          accessToken: Select(['secret'], Var('accessToken')),
        },
      ),
    )
  } catch (error) {
    console.error(error)
    return res.status(error.requestResult?.statusCode ?? 500).json({
      message: error.message ?? 'Oops! Something went wrong',
    })
  }

  return res.json(refreshResult)
}

export default catchHandler(handler)
