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

interface DirectMessageUser {
  id: string
  name: string
  photo: string
}

interface DirectMessage {
  id: string
  channelId: string
  withUser: DirectMessageUser
}

export type DirectMessagesPayload = Page<DirectMessage>

export default handler<DirectMessagesPayload>()
  .use(authorize)
  .get(async (req, res) => {
    try {
      const { faunaToken } = getSession(req)
      const fauna = createFaunaClient(faunaToken)

      try {
        const data = await fauna.query<DirectMessagesPayload>(
          Let(
            {
              paginationResult: Map(
                Paginate(
                  Union(
                    Match(
                      Index('dms_by_user1_sorted_by_last_interaction_desc'),
                      CurrentIdentity(),
                    ),
                    Match(
                      Index('dms_by_user2_sorted_by_last_interaction_desc'),
                      CurrentIdentity(),
                    ),
                  ),
                ),
                Lambda(
                  ['lastInteraction', 'ref'],
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
                        uid: Select(['data', 'uid'], Var('withUser')),
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

        return res.json(data)
      } catch (error) {
        return handleFaunaError(error, res)
      }
    } catch (error) {
      return handleServerError(error, res)
    }
  })
