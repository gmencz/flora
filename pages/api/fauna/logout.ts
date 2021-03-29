import { Call, Function } from 'faunadb'
import { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import setCookie from '@/util/setCookie'
import { createFaunaClient } from '@/lib/fauna'

const handler = nc<NextApiRequest, NextApiResponse>().post(async (req, res) => {
  const refreshToken = req.cookies.chatskeeFaunaRefresh
  const fauna = createFaunaClient(refreshToken)

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
})

export default handler
