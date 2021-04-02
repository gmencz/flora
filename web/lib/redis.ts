import Redis from 'ioredis'

export const redis = new Redis({
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
})
