import createTwilioClient from 'twilio'
import { authorize, handler } from '@/util/handler'
import { redis } from '@/lib/redis'

interface IceServer {
  urls: string | string[]
  username: string
  credential: string
}

function transformIceServers(token: any) {
  const { iceServers } = token as { iceServers: IceServer[] }
  return iceServers.map(iceServer => ({
    urls: iceServer.urls,
    username: iceServer.username,
    credential: iceServer.credential,
  }))
}

export default handler()
  .use(authorize)
  .get(async (_req, res) => {
    const cachedToken = await redis.get('twilio-nts-token')

    if (!cachedToken) {
      res.setHeader('x-chatskee-cache', 'MISS')

      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      const twilio = createTwilioClient(accountSid, authToken)
      const oneDay = 86400 // 24 hours
      const oneHour = 3600
      const token = await twilio.tokens.create({ ttl: oneDay })

      // We cache the token so we don't have to hit twilio's api
      // every time we need an NTS token.
      await redis.set(
        'twilio-nts-token',
        JSON.stringify(token),
        'ex',
        oneDay - oneHour,
      )

      return res.json({
        iceServers: transformIceServers(token),
      })
    }

    res.setHeader('x-chatskee-cache', 'HIT')

    const token = JSON.parse(cachedToken)
    return res.json({
      iceServers: transformIceServers(token),
    })
  })
