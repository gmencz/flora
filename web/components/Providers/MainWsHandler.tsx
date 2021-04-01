import { useGatewayWs } from '@/hooks/useGatewayWs'
import { useNotificationSoundStore } from '@/hooks/useNotificationSoundStore'
import { MaybeError } from '@/lib/types'
import { VoiceCallOffer } from '@chatskee/gateway'
import { ReactNode, useEffect } from 'react'

interface MainWsHandlerProviderProps {
  children: ReactNode
}

export function useMainWsHandler() {
  const conn = useGatewayWs()
  const play = useNotificationSoundStore(state => state.play)

  useEffect(() => {
    if (!conn) {
      return
    }

    const unsubs = [
      conn.addListener<MaybeError<VoiceCallOffer>>(
        'voice_call_offer',
        event => {
          if (!event.err) {
            play('/sounds/call-sound.mp3', { loop: true })
          }
        },
      ),
    ]

    return () => {
      unsubs.forEach(u => u())
    }
  }, [conn, play])
}

export function MainWsHandlerProvider({
  children,
}: MainWsHandlerProviderProps) {
  useMainWsHandler()
  return <>{children}</>
}
