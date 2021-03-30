import { redisClient } from './client'

export function getUser(id: string) {
  return redisClient.exists(`u:${id}`)
}
