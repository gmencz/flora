import createClient from '@/lib/faunadb'
import catchHandler from '@/util/catchHandler'
import {
  Collection,
  CurrentIdentity,
  Equals,
  Get,
  If,
  Let,
  Ref,
  Select,
  Var,
} from 'faunadb'
import { NextApiRequest, NextApiResponse } from 'next'
import { DM } from '.'

export interface DMDetails {
  withUser: DM['withUser']
}

async function handle(req: NextApiRequest, res: NextApiResponse) {
  const faunaToken = req.cookies.chatskeeFaunaToken
  const fauna = createClient(faunaToken)

  const { dm } = req.query as Record<string, string>
  const dmDoc = await fauna.query(
    Let(
      {
        dmDoc: Get(Ref(Collection('dms'), dm)),
        user1: Select(['data', 'user1Ref'], Var('dmDoc')),
        user2: Select(['data', 'user2Ref'], Var('dmDoc')),
        withUserRef: If(
          Equals(Var('user1'), CurrentIdentity()),
          Get(Var('user2')),
          Get(Var('user1')),
        ),
      },
      {
        withUser: {
          id: Select(['ref', 'id'], Var('withUserRef')),
          name: Select(['data', 'name'], Var('withUserRef')),
          photo: Select(['data', 'photoURL'], Var('withUserRef')),
        },
      },
    ),
  )

  return res.json(dmDoc)
}

export default catchHandler(handle)
