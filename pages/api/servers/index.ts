import createClient from '@/lib/faunadb'
import { NextApiRequest, NextApiResponse } from 'next'
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
import catchHandler from '@/util/catchHandler'
import resolvePagination from '@/util/resolvePagination'
import getPaginationOptions from '@/util/getPaginationOptions'
import { Page } from '@/lib/types'

export interface Server {
  id: string
  name: string
  photo: string
}

async function handle(req: NextApiRequest, res: NextApiResponse) {
  const faunaToken = req.cookies.chatskeeFaunaToken
  const fauna = createClient(faunaToken)

  const { limit, after, before } = req.query as Record<string, string>

  const paginatedServers = await fauna.query<Page<Server>>(
    Let(
      {
        paginationResult: Map(
          Paginate(
            Match(Index('server_users_by_user'), CurrentIdentity()),
            getPaginationOptions(
              {
                size: limit ? Number(limit) : undefined,
                after,
                before,
              },
              'server_users',
            ),
          ),
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
      },
      resolvePagination(Var('paginationResult')),
    ),
  )

  return res.json(paginatedServers)
}

export default catchHandler(handle)
