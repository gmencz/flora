import { CurrentToken, Delete } from 'faunadb'
import { createFaunaClient } from '@/lib/fauna'
import { authorize, getUser, handler } from '@/util/handler'

export default handler()
  .use(authorize)
  .post(async (req, res) => {
    const user = getUser(req)

    const fauna = createFaunaClient(user.faunaToken)
    await fauna.query(Delete(CurrentToken()))

    req.session.destroy()

    return res.status(200).send('Logged out')
  })
