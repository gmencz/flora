import type { IAgoraRTCClient, ClientConfig, IAgoraRTC } from 'agora-rtc-sdk-ng'
import { useEffect, useRef } from 'react'

async function initAgora() {
  const { default: agora } = await import('agora-rtc-sdk-ng')
  return agora
}

export function useAgoraClient(clientConfig: ClientConfig) {
  const clientRef = useRef<IAgoraRTCClient>()
  const agoraRef = useRef<IAgoraRTC>()

  useEffect(() => {
    initAgora()
      .then(agora => {
        agoraRef.current = agora
        clientRef.current = agora.createClient(clientConfig)
      })
      .catch(err => {
        console.error(`Error initializing agora: ${err}`)
      })

    return () => {
      clientRef.current?.leave()
    }
  }, [clientConfig])

  return { client: clientRef.current, rtc: agoraRef.current }
}
