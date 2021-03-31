import { createFaunaClient } from '@/lib/fauna'
import {
  authorize,
  getSession,
  handleFaunaError,
  handler,
  handleServerError,
  Params,
} from '@/util/handler'
import {
  Collection,
  CurrentIdentity,
  Delete,
  Get,
  Index,
  Let,
  Match,
  Ref,
  Select,
  Union,
  Var,
} from 'faunadb'

export interface UnfriendVariables {
  id: string
}

export interface UnfriendPayload {
  id: string
}

export default handler<UnfriendPayload>()
  .use(authorize)
  .delete(async (req, res) => {
    try {
      const { id } = req.query as Params<UnfriendVariables>
      const { faunaToken } = getSession(req)
      const fauna = createFaunaClient(faunaToken)

      try {
        const deletedId = await fauna.query<string>(
          Let(
            {
              friendRequest: Select(
                ['ref'],
                Get(
                  Union(
                    Match(Index('friends_by_user1_and_user2'), [
                      CurrentIdentity(),
                      Ref(Collection('users'), id),
                    ]),
                    Match(Index('friends_by_user1_and_user2'), [
                      Ref(Collection('users'), id),
                      CurrentIdentity(),
                    ]),
                  ),
                ),
              ),
            },
            Select(['ref', 'id'], Delete(Var('friendRequest'))),
          ),
        )

        return res.json({ id: deletedId })
      } catch (error) {
        return handleFaunaError(error, res)
      }
    } catch (error) {
      return handleServerError(error, res)
    }
  })
