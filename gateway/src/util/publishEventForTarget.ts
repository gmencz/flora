import { redisPublisher } from '../lib/redis/publisher'
import { Opcode } from '../types'
import { serialize } from './serialization'

export function publishEventForTarget(op: Opcode, d: any, target: string) {
  const redisEvent = serialize({
    event: {
      op,
      d,
    },
    target,
  })

  redisPublisher.publish('events', redisEvent as string)
}
