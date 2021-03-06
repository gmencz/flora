import createClient from '@/lib/faunadb'
import {
  Collection,
  CurrentIdentity,
  Get,
  Index,
  Lambda,
  Let,
  Map,
  Match,
  Paginate,
  Ref,
  Select,
  Var,
} from 'faunadb'
import { NextApiRequest, NextApiResponse } from 'next'

interface Server {
  id: string
  name: string
  photo: string
}

export interface ServersPayload {
  data: Server[]
  after?: any[]
  before?: any[]
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const faunaToken = req.cookies.chatskeeFaunaToken
  const fauna = createClient(faunaToken)

  const { limit = DEFAULT_LIMIT, after } = req.query

  if (limit > MAX_LIMIT) {
    return res.status(400).json({
      message: `The 'limit' query parameter must be less than or equal to ${MAX_LIMIT}`,
    })
  }

  const paginatedServers = await fauna.query<ServersPayload>(
    Map(
      Paginate(Match(Index('server_users_by_userRef'), CurrentIdentity()), {
        size: Number(limit),
        after: after ? Ref(Collection('server_users'), after) : undefined,
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

  return res.json(paginatedServers)
}
