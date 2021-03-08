import { createClient } from '@/lib/fauna'
import { Call, Function } from 'faunadb'
import { NextApiRequest, NextApiResponse } from 'next'
import { clearRefreshTokenCookie } from '@/lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const refreshToken = req.cookies.chatskeeFaunaRefresh
  const fauna = createClient(refreshToken)

  const { allDevices = false } = req.body

  try {
    await fauna.query(Call(Function('logout'), allDevices))
  } catch (error) {
    console.error(error)
  }

  clearRefreshTokenCookie(res)
  return res.status(200).json({
    ok: true,
  })
}

export default handler
