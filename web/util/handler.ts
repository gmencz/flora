import nc, { NextHandler } from 'next-connect'
import { NextApiResponse } from 'next'
import { RequestWithSession } from '@/lib/types'
import { session } from './session'
import { errors } from 'faunadb'

export interface ApiError {
  msg: string
}

export function handler<TPayload>() {
  return nc<RequestWithSession, NextApiResponse<TPayload | ApiError>>().use(
    session,
  )
}

export function getSession(req: RequestWithSession) {
  return req.session.get<{ faunaToken: string }>('user')!
}

export function authorize(
  req: RequestWithSession,
  res: NextApiResponse,
  next: NextHandler,
) {
  const session = getSession(req)

  if (!session) {
    res.status(401).json({ msg: 'Unauthenticated' })
    return
  }

  next()
}

export function handleFaunaError(
  error: errors.FaunaError,
  res: NextApiResponse<ApiError>,
) {
  return res.status(400).json({ msg: error.description })
}

export function handleServerError(
  error: Error,
  res: NextApiResponse<ApiError>,
) {
  return res.status(500).json({ msg: error.message })
}

// Type utils for handlers

export type Params<TParams> = TParams & Record<string, never>
