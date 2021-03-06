import createClient from '@/lib/faunadb'
import {
  CurrentIdentity,
  Get,
  Index,
  Lambda,
  Let,
  Map,
  Match,
  Paginate,
  Select,
  Var,
} from 'faunadb'
import { NextApiRequest, NextApiResponse } from 'next'

export interface Server {
  id: string
  name: string
  photo: string
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const faunaToken = req.cookies.chatskeeFaunaToken
  const fauna = createClient(faunaToken)

  const { limit = DEFAULT_LIMIT } = req.query

  if (limit > MAX_LIMIT) {
    return res.status(400).json({
      message: `The 'limit' query parameter must be less than or equal to ${MAX_LIMIT}`,
    })
  }

  const servers = await fauna.query<Server[]>(
    Map(
      Paginate(Match(Index('server_users_by_userRef'), CurrentIdentity()), {
        size: Number(limit),
      }),
      Lambda(
        'userAndServerRefs',
        Let(
          { serverDoc: Get(Select([1], Var('userAndServerRefs'))) },
          {
            id: Select(['ref', 'id'], Var('serverDoc')),
            name: Select(['data', 'name'], Var('serverDoc')),
            photo: Select(['data', 'photo'], Var('serverDoc')),
          },
        ),
      ),
    ),
  )

  return res.json(servers)
}
