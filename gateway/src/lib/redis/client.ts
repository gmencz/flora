import Redis from 'ioredis'

export const redisClient = new Redis({
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
})
