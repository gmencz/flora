import { useContext } from 'react'
import { WebSocketContext } from '@/components/Providers/WebSocket'

export function useWsConn() {
  const context = useContext(WebSocketContext)

  if (!context) {
    throw new Error(`Can't use hook 'useWsConn' outside of a WebSocketProvider`)
  }

  return context.conn!
}
