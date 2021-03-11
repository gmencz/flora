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

const directMessagesFql = Let(
  {
    paginationResult: Map(
      Paginate(
        Union(
          Match(Index('dms_by_user1'), CurrentIdentity()),
          Match(Index('dms_by_user2'), CurrentIdentity()),
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
)

export default directMessagesFql
