import { redisPublisher } from './publisher'

export function getUser(id: string) {
  return redisPublisher.exists(`u:${id}`)
}
