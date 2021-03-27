import { RtcTokenBuilder, RtcRole } from 'agora-access-token'
import { NextApiRequest, NextApiResponse } from 'next'
import admin from '@/lib/firebase/server'
import nc from 'next-connect'

interface Body {
  publisher: string
  possibleSubscriber: string
}

const handler = nc<NextApiRequest, NextApiResponse>().post(async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({
      message: 'Missing authorization header',
    })
  }

  if (!req.headers.authorization.startsWith('Bearer')) {
    return res.status(401).json({
      message: 'Invalid authorization header, must use the Bearer format',
    })
  }

  const [, idToken] = req.headers.authorization.split(' ')

  if (!idToken) {
    return res.status(401).json({
      message: 'Invalid authorization header, missing token',
    })
  }

  let user: admin.auth.DecodedIdToken
  try {
    user = await admin.auth().verifyIdToken(idToken)
  } catch (error) {
    console.error(error)
    return res.status(401).json({
      message: 'Invalid ID token',
    })
  }

  const { uid } = user

  const { publisher, possibleSubscriber } = req.body as Body

  const role = RtcRole.PUBLISHER
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!
  const certificate = process.env.AGORA_CERTIFICATE!
  const channelName = `voice_${publisher}_${possibleSubscriber}`

  // Give the user 1 hour to join the channel before the token expires
  const expireTime = 3600
  const currentTime = Math.floor(Date.now() / 1000)
  const privilegeExpireTime = currentTime + expireTime

  const token = RtcTokenBuilder.buildTokenWithAccount(
    appId,
    certificate,
    channelName,
    uid,
    role,
    privilegeExpireTime,
  )

  return res.json({
    channelName,
    token,
  })
})

export default handler
