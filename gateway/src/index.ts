if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' })
}

import { startServer } from './server'

startServer()
