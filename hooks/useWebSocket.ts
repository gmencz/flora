import { useEffect, useRef } from 'react'

const hostname =
  process.env.NODE_ENV === 'production'
    ? 'gateway.gabrielmendezc.com'
    : 'localhost:9999'

export function useWebSocket(userId?: string) {
  const webSocketRef = useRef<WebSocket>()

  useEffect(() => {
    if (!userId) {
      return
    }

    let scheme = 'ws'
    if (window.location.protocol === 'https:') {
      scheme += 's'
    }

    const url = `${scheme}://${hostname}?u=${userId}`
    const socket = new WebSocket(url)
    webSocketRef.current = socket

    return () => {
      socket.close()
    }
  }, [userId])

  return webSocketRef.current
}
