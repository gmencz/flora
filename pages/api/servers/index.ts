import createClient from '@/lib/faunadb'
import {
  CurrentIdentity,
  Get,
  Lambda,
  Map,
  Merge,
  Select,
  Take,
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
  const { limit = DEFAULT_LIMIT } = req.query
  const client = createClient(faunaToken)

  if (limit > MAX_LIMIT) {
    return res.status(400).json({
      message: `The 'limit' query parameter must be less than or equal to 100`,
    })
  }

  const servers = await client.query<Server[]>(
    Map(
      Take(Number(limit), Select(['data', 'servers'], Get(CurrentIdentity()))),
      Lambda(
        'ref',
        Merge(
          { id: Select('id', Var('ref')) },
          Select(['data'], Get(Var('ref'))),
        ),
      ),
    ),
  )

  return res.json(servers)
}
