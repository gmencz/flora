import Redis from 'ioredis'

export const redisSubscriber = new Redis({
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
})
