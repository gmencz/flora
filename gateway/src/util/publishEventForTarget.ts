import { redisPublisher } from '../lib/redis/publisher'
import { Opcode, SocketEvent } from '../types'
import { serialize } from './serialization'

export function publishEventForTarget(
  op: SocketEvent['op'],
  d: SocketEvent['d'],
  target: string,
) {
  const redisEvent = serialize({
    event: {
      op,
      d,
    },
    target,
  })

  redisPublisher.publish('events', redisEvent as string)
}
