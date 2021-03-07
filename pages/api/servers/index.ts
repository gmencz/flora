import createClient, { Reference } from '@/lib/faunadb'
import ifTruthy from '@/util/ifTruthy'
import { NextApiRequest, NextApiResponse } from 'next'
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

interface Server {
  id: string
  name: string
  photo: string
}

export interface ServersPayload {
  data: Server[]
  after?: Reference[]
  before?: Reference[]
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const faunaToken = req.cookies.chatskeeFaunaToken
  const fauna = createClient(faunaToken)

  const { limit, after } = req.query

  const paginatedServers = await fauna.query<ServersPayload>(
    Map(
      Paginate(Match(Index('server_users_by_user'), CurrentIdentity()), {
        size: ifTruthy(limit, Number(limit)),
        after: ifTruthy(after, Ref(Collection('server_users'), after)),
      }),
      Lambda(
        'ref',
        Let(
          {
            serverDoc: Get(Select(['data', 'serverRef'], Get(Var('ref')))),
          },
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
