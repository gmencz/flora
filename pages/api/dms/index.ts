import createClient from '@/lib/faunadb'
import { Page } from '@/lib/types'
import catchHandler from '@/util/catchHandler'
import getPaginationOptions from '@/util/getPaginationOptions'
import resolvePagination from '@/util/resolvePagination'
import {
  CurrentIdentity,
  Equals,
  Get,
  If,
  Index,
  Lambda,
  Let,
  Map,
  Match,
  Paginate,
  Select,
  Union,
  Var,
} from 'faunadb'
import { NextApiRequest, NextApiResponse } from 'next'

interface User {
  id: string
  name: string
  photo: string
}

export interface DM {
  id: string
  channelId: string
  withUser: User
}

async function handle(req: NextApiRequest, res: NextApiResponse) {
  const faunaToken = req.cookies.chatskeeFaunaToken
  const fauna = createClient(faunaToken)

  const { limit, after, before } = req.query as Record<string, string>

  const paginatedDms = await fauna.query<Page<DM>>(
    Let(
      {
        paginationResult: Map(
          Paginate(
            Union(
              Match(Index('dms_by_user1'), CurrentIdentity()),
              Match(Index('dms_by_user2'), CurrentIdentity()),
            ),
            getPaginationOptions(
              { size: limit ? Number(limit) : undefined, after, before },
              'dms',
            ),
          ),
          Lambda(
            'ref',
            Let(
              {
                dmDoc: Get(Var('ref')),
                user1: Select(['data', 'user1Ref'], Var('dmDoc')),
                user2: Select(['data', 'user2Ref'], Var('dmDoc')),
                withUser: If(
                  Equals(Var('user1'), CurrentIdentity()),
                  Get(Var('user2')),
                  Get(Var('user1')),
                ),
              },
              {
                id: Select(['ref', 'id'], Var('dmDoc')),
                channelId: Select(
                  ['ref', 'id'],
                  Get(Select(['data', 'channel'], Var('dmDoc'))),
                ),
                withUser: {
                  id: Select(['ref', 'id'], Var('withUser')),
                  name: Select(['data', 'name'], Var('withUser')),
                  photo: Select(['data', 'photoURL'], Var('withUser')),
                },
              },
            ),
          ),
        ),
      },
      resolvePagination(Var('paginationResult')),
    ),
  )

  return res.json(paginatedDms)
}

export default catchHandler(handle)
