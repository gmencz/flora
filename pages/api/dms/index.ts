import createClient from '@/lib/faunadb'
import catchHandler from '@/util/catchHandler'
import ifThruthy from '@/util/ifTruthy'
import {
  Any,
  Collection,
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
  Ref,
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

interface DM {
  id: string
  channelId: string
  withUser: User
}

async function handle(req: NextApiRequest, res: NextApiResponse) {
  const faunaToken = req.cookies.chatskeeFaunaToken
  const fauna = createClient(faunaToken)

  const { limit, after } = req.query

  const paginatedDms = await fauna.query<DM[]>(
    Map(
      Paginate(
        Union(
          Match(Index('dms_by_user1'), CurrentIdentity()),
          Match(Index('dms_by_user2'), CurrentIdentity()),
        ),
        {
          size: ifThruthy(limit, Number(limit)),
          after: ifThruthy(after, Ref(Collection('dms'), after)),
        },
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
  )

  return res.json(paginatedDms)
}

export default catchHandler(handle)
