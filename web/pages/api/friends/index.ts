import { createFaunaClient } from '@/lib/fauna'
import { Page } from '@/lib/types'
import {
  authorize,
  getSession,
  handleFaunaError,
  handler,
  handleServerError,
} from '@/util/handler'
import resolvePagination from '@/util/resolvePagination'
import {
  Count,
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

export interface Friend {
  id: string
  name: string
  photo: string
  friendedAt: string
}

export interface FriendsPayload {
  friends: Page<Friend>
  friendsCount: number
}

export default handler<FriendsPayload>()
  .use(authorize)
  .get(async (req, res) => {
    try {
      const { faunaToken } = getSession(req)
      const fauna = createFaunaClient(faunaToken)

      try {
        const data = await fauna.query<FriendsPayload>(
          Let(
            {
              match: Union(
                Match(Index('friends_by_user1'), CurrentIdentity()),
                Match(Index('friends_by_user2'), CurrentIdentity()),
              ),
              paginationResult: Map(
                Paginate(Var('match')),
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
                      friendedAt: ToString(
                        Select(['data', 'friendedAt'], Var('doc')),
                      ),
                    },
                  ),
                ),
              ),
            },
            {
              friends: resolvePagination(Var('paginationResult')),
              friendsCount: Count(Var('match')),
            },
          ),
        )

        return res.json(data)
      } catch (error) {
        return handleFaunaError(error, res)
      }
    } catch (error) {
      return handleServerError(error, res)
    }
  })
