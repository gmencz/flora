import createTwilioClient from 'twilio'
import Redis from 'ioredis'
import { authorize, handler } from '@/util/handler'

interface IceServer {
  urls: string | string[]
  username: string
  credential: string
}

const redis = new Redis({
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
})

export default handler()
  .use(authorize)
  .get(async (_req, res) => {
    const cachedToken = await redis.get('twilio-nts-token')

    if (!cachedToken) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      const twilio = createTwilioClient(accountSid, authToken)
      const tokenTtl = 86400
      const token = await twilio.tokens.create({ ttl: tokenTtl })
      await redis.set(
        'twilio-nts-token',
        JSON.stringify(token),
        'ex',
        tokenTtl / 2,
      )

      return res.json({
        iceServers: ((token.iceServers as unknown) as IceServer[]).map(
          iceServer => ({
            urls: iceServer.urls,
            username: iceServer.username,
            credential: iceServer.credential,
          }),
        ),
      })
    }

    const token = JSON.parse(cachedToken)
    return res.json({
      iceServers: (token.iceServers as IceServer[]).map(iceServer => ({
        urls: iceServer.urls,
        username: iceServer.username,
        credential: iceServer.credential,
      })),
    })
  })
