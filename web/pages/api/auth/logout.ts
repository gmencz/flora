import { CurrentToken, Delete } from 'faunadb'
import { createFaunaClient } from '@/lib/fauna'
import { authorize, getSession, handler } from '@/util/handler'

export default handler()
  .use(authorize)
  .post(async (req, res) => {
    const session = getSession(req)

    const fauna = createFaunaClient(session.faunaToken)
    await fauna.query(Delete(CurrentToken()))

    req.session.destroy()

    return res.status(200).json({ ok: true })
  })
