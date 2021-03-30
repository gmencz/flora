import Redis from 'ioredis'

export const redisPublisher = new Redis({
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
})
