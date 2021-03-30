import { ReactNode, useContext, useEffect } from 'react'
import { WebSocketContext } from './WebSocket'

interface MainWsHandlerProviderProps {
  children: ReactNode
}

export function useMainWsHandler() {
  const { conn } = useContext(WebSocketContext)

  useEffect(() => {
    if (!conn) {
      return
    }

    const unsubs: (() => void)[] = [
      // conn.addListener('voice_call_offer', () => {
      //   console.log('Call offer')
      // }),
      // conn.addListener('voice_call_answer', () => {
      //   console.log('Call answer')
      // }),
      // conn.addListener('new_ice_candidate', () => {
      //   console.log('New ICE candidate')
      // }),
    ]

    return () => {
      unsubs.forEach(u => u())
    }
  }, [conn])
}

export function MainWsHandlerProvider({
  children,
}: MainWsHandlerProviderProps) {
  useMainWsHandler()
  return <>{children}</>
}
