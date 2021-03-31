import nc from 'next-connect'
import { NextApiResponse } from 'next'
import { RequestWithSession } from '@/lib/types'
import { session } from './session'

export function handler() {
  return nc<RequestWithSession, NextApiResponse>().use(session)
}

export function getUser(req: RequestWithSession) {
  return req.session.get<{ faunaToken: string }>('user')!
}

export function authorize(req: RequestWithSession, res: NextApiResponse) {
  const user = getUser(req)

  if (!user) {
    res.status(401).end()
    return
  }
}
