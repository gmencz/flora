import resolvePagination from '@/util/resolvePagination'
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
  ToString,
  Var,
} from 'faunadb'

const friendsFql = Let(
  {
    paginationResult: Map(
      Paginate(Match(Index('friends_by_user'), CurrentIdentity())),
      Lambda(
        'ref',
        Let(
          {
            doc: Get(Var('ref')),
            friendDoc: Get(Select(['data', 'friendRef'], Var('doc'))),
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
