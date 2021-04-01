import { useContext } from 'react'
import { WebSocketContext } from '@/components/Providers/WebSocket'

export function useGatewayWs() {
  const context = useContext(WebSocketContext)

  if (!context) {
    throw new Error(
      `Can't use hook 'useGatewayWs' outside of a WebSocketProvider`,
    )
  }

  return context.conn!
}
