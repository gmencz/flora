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
  ToString,
  Union,
  Var,
} from 'faunadb'

const friendsFql = Let(
  {
    paginationResult: Map(
      Paginate(
        Union(
          Match(Index('friends_by_user1'), CurrentIdentity()),
          Match(Index('friends_by_user2'), CurrentIdentity()),
        ),
      ),
      Lambda(
        'ref',
        Let(
          {
            doc: Get(Var('ref')),
            user1Ref: Select(['data', 'user1Ref'], Var('doc')),
            user2Ref: Select(['data', 'user2Ref'], Var('doc')),
            friendDoc: If(
              Equals(CurrentIdentity(), Var('user1Ref')),
              Get(Var('user2Ref')),
              Get(Var('user1Ref')),
            ),
          },
          {
            id: Select(['ref', 'id'], Var('friendDoc')),
            name: Select(['data', 'name'], Var('friendDoc')),
            photo: Select(['data', 'photoURL'], Var('friendDoc')),
            friendedAt: ToString(Select(['data', 'friendedAt'], Var('doc'))),
          },
        ),
      ),
    ),
  },
  resolvePagination(Var('paginationResult')),
)

export default friendsFql
