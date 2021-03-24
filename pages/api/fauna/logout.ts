import { Call, Function } from 'faunadb'
import { NextApiRequest, NextApiResponse } from 'next'
import catchHandler from '@/util/catchHandler'
import { createClient } from '@/lib/FaunaClient'
import setCookie from '@/util/setCookie'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const refreshToken = req.cookies.chatskeeFaunaRefresh
  const fauna = createClient(refreshToken)

  const { allDevices = false } = req.body

  try {
    await fauna.query(Call(Function('logout'), allDevices))
  } catch (error) {
    console.error(error)
  }

  setCookie(res, 'chatskeeFaunaRefresh', '', {
    maxAge: -1,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  return res.status(200).json({
    ok: true,
  })
}

export default catchHandler(handler)
