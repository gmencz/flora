import { DirectMessagesPayload } from '@/api/directMessages'
import { useGatewayWs } from '@/hooks/useGatewayWs'
import { useNotificationSoundStore } from '@/hooks/useNotificationSoundStore'
import { useOneToOneCallStore } from '@/hooks/useOneToOneCallStore'
import { useUpdateDmLastInteraction } from '@/hooks/useUpdateDmLastInteraction'
import { useWebRTC } from '@/hooks/useWebRTC'
import { MaybeError } from '@/lib/types'
import { VoiceCallAnswer, VoiceCallOffer } from '@chatskee/gateway'
import { ReactNode, useEffect } from 'react'
import { useQueryClient } from 'react-query'
import shallow from 'zustand/shallow'

interface MainWsHandlerProviderProps {
  children: ReactNode
}

export function useMainWsHandler() {
  const conn = useGatewayWs()
  const play = useNotificationSoundStore(state => state.play)
  const queryClient = useQueryClient()
  const { cleanup } = useWebRTC()

  const {
    setIsCurrentPeerConnected,
    setIsOtherPeerConnected,
  } = useOneToOneCallStore(
    state => ({
      isCurrentPeerConnected: state.isCurrentPeerConnected,
      setIsCurrentPeerConnected: state.setIsCurrentPeerConnected,
      isOtherPeerConnected: state.isOtherPeerConnected,
      setIsOtherPeerConnected: state.setIsOtherPeerConnected,
    }),
    shallow,
  )

  const { mutate: updateDmLastInteraction } = useUpdateDmLastInteraction({
    onSuccess: (_, variables) => {
      queryClient.setQueryData<DirectMessagesPayload>('dms', existing => {
        const updatedDm = existing?.data.find(dm => dm.id === variables.id)

        if (!updatedDm) {
          return existing!
        }

        return {
          before: existing!.before,
          after: existing!.after,
          data: [
            updatedDm,
            ...existing!.data.filter(dm => dm.id !== updatedDm.id),
          ],
        }
      })
    },
  })

  useEffect(() => {
    if (!conn) {
      return
    }

    const unsubs = [
      conn.addListener<MaybeError<VoiceCallOffer>>(
        'voice_call_offer',
        event => {
          if (event.err) {
            return
          }

          play('/sounds/call-sound.mp3', { loop: true })
          updateDmLastInteraction({ id: event.dm })
        },
      ),

      conn.addListener<MaybeError<VoiceCallAnswer>>(
        'voice_call_answer',
        event => {
          if (event.err) {
            return
          }

          play('/sounds/joined-call.mp3')
        },
      ),

      conn.addListener<MaybeError<1>>('voice_call_ended', event => {
        if (event.err) {
          return
        }

        cleanup()
        setIsCurrentPeerConnected(false)
        setIsOtherPeerConnected(false)
        play('/sounds/ended-call.mp3')
      }),
    ]

    return () => {
      unsubs.forEach(u => u())
    }
  }, [
    cleanup,
    conn,
    play,
    setIsCurrentPeerConnected,
    setIsOtherPeerConnected,
    updateDmLastInteraction,
  ])
}

export function MainWsHandlerProvider({
  children,
}: MainWsHandlerProviderProps) {
  useMainWsHandler()
  return <>{children}</>
}
