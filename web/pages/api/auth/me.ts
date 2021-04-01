import { User } from '@/fauna/auth/login'
import { createFaunaClient } from '@/lib/fauna'
import {
  authorize,
  getSession,
  handleFaunaError,
  handler,
  handleServerError,
} from '@/util/handler'
import { CurrentIdentity, Get, Let, Select, ToString, Var } from 'faunadb'

export default handler()
  .use(authorize)
  .get(async (req, res) => {
    try {
      const session = getSession(req)
      const fauna = createFaunaClient(session.faunaToken)

      try {
        const me = await fauna.query<User>(
          Let(
            {
              user: Get(CurrentIdentity()),
            },
            {
              id: Select(['ref', 'id'], Var('user')),
              name: Select(['data', 'name'], Var('user')),
              email: Select(['data', 'email'], Var('user')),
              photoURL: Select(['data', 'photoURL'], Var('user')),
              firebaseUid: Select(['data', 'uid'], Var('user')),
              created: ToString(Select(['data', 'created'], Var('user'))),
            },
          ),
        )

        return res.json(me)
      } catch (error) {
        return handleFaunaError(error, res)
      }
    } catch (error) {
      return handleServerError(error, res)
    }
  })
