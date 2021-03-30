import { redisPublisher } from '../lib/redis/publisher'
import { SocketEvent } from '../types'
import { serialize } from './serialization'

export function publishEvent(event: SocketEvent, target: string) {
  const redisEvent = serialize({
    event,
    target,
  })

  redisPublisher.publish('events', redisEvent as string)
}
