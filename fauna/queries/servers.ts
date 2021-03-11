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
  Var,
} from 'faunadb'

const serversFql = Let(
  {
    paginationResult: Map(
      Paginate(Match(Index('server_users_by_user'), CurrentIdentity())),
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
)

export default serversFql
