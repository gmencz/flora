import WebSocket from 'ws'
import { redisSubscriber } from '../lib/redis'
import { RedisEvent } from '../types'
import { deserialize, serialize } from './serialization'

export async function initRedisPubsub(connectedUsers: Map<string, WebSocket>) {
  await redisSubscriber.subscribe('events')

  redisSubscriber.on('message', (channel: string, message: string) => {
    if (channel === 'events') {
      const { event, target } = deserialize<RedisEvent>(message)

      const targetSocket = connectedUsers.get(target)
      if (!targetSocket) {
        /*
          If the target socket is not found this can mean one of two things:
          
          1. The socket is on a different node.
        
          2. The connection with the socket was closed before the message was published.
          
          For now we're just going to assume it's the first one but in the future
          we should handle this differently.
        */

        return
      }

      targetSocket.send(serialize(event))
    }
  })
}
