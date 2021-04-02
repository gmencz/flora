if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' })
}

import { startServer } from './server'
import { redisPublisher, redisSubscriber } from './lib/redis'

startServer().catch(async reason => {
  console.error(`Server startup error: ${reason}`)

  try {
    await Promise.all([redisPublisher.quit(), redisSubscriber.quit()])
  } catch (error) {
    console.error(
      `Something went wrong cleaning up after server startup error: ${error}`,
    )
  }
})
