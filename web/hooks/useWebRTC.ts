import { WebRTCContext } from '@/components/Providers/WebRTC'
import { useContext } from 'react'

export function useWebRTC() {
  const context = useContext(WebRTCContext)

  if (!context) {
    throw new Error(`Can't use hook 'useWebRTC' outside of a WebSocketProvider`)
  }

  return context
}
