import { createFaunaClient } from '@/lib/fauna'
import {
  authorize,
  getSession,
  handleFaunaError,
  handler,
  handleServerError,
  Params,
} from '@/util/handler'
import { Collection, Now, Ref, Update } from 'faunadb'

export interface UpdateLastInteractionVariables {
  id: string
}

export default handler()
  .use(authorize)
  .put(async (req, res) => {
    try {
      const { id } = req.query as Params<UpdateLastInteractionVariables>
      const { faunaToken } = getSession(req)
      const fauna = createFaunaClient(faunaToken)

      try {
        await fauna.query(
          Update(Ref(Collection('dms'), id), {
            data: {
              lastInteraction: Now(),
            },
          }),
        )

        return res.json({ ok: true })
      } catch (error) {
        return handleFaunaError(error, res)
      }
    } catch (error) {
      return handleServerError(error, res)
    }
  })
