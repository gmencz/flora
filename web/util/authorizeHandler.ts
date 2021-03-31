import { NextApiRequest } from 'next'
import admin from '@/lib/firebase/server'
import { RequestWithSession } from '@/lib/types'

export async function authorizeHandler(
  req: NextApiRequest | RequestWithSession,
) {
  if (!req.headers.authorization) {
    throw new Error('Missing authorization header')
  }

  if (!req.headers.authorization.startsWith('Bearer')) {
    throw new Error('Invalid authorization header, must use the Bearer format')
  }

  const [, idToken] = req.headers.authorization.split(' ')

  if (!idToken) {
    throw new Error('Invalid authorization header, missing token')
  }

  let user: admin.auth.DecodedIdToken
  try {
    user = await admin.auth().verifyIdToken(idToken)
  } catch (error) {
    console.error(error)
    throw new Error('Invalid ID token')
  }

  return user
}
