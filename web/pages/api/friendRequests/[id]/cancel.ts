import { createFaunaClient } from '@/lib/fauna'
import {
  authorize,
  getSession,
  handleFaunaError,
  handler,
  handleServerError,
  Params,
} from '@/util/handler'
import { Collection, Delete, Ref } from 'faunadb'

export interface CancelFriendRequestVariables {
  id: string
}

export default handler()
  .use(authorize)
  .post(async (req, res) => {
    try {
      const variables = req.query as Params<CancelFriendRequestVariables>
      const { faunaToken } = getSession(req)
      const fauna = createFaunaClient(faunaToken)

      try {
        await fauna.query(
          Delete(Ref(Collection('user_friend_requests'), variables.id)),
        )

        return res.json({ ok: true })
      } catch (error) {
        return handleFaunaError(error, res)
      }
    } catch (error) {
      return handleServerError(error, res)
    }
  })
