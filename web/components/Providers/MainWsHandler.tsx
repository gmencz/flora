import { DirectMessagesPayload } from '@/api/directMessages'
import { useGatewayWs } from '@/hooks/useGatewayWs'
import { useNotificationSoundStore } from '@/hooks/useNotificationSoundStore'
import { useOneToOneCallStore } from '@/hooks/useOneToOneCallStore'
import { useUpdateDmLastInteraction } from '@/hooks/useUpdateDmLastInteraction'
import { useWebRTC } from '@/hooks/useWebRTC'
import { MaybeError } from '@/lib/types'
import { VoiceCallAnswer, VoiceCallOffer } from '@chatskee/gateway'
import { useCallback, useEffect } from 'react'
import { useQueryClient } from 'react-query'
import shallow from 'zustand/shallow'

export function useMainWsHandler() {
  const conn = useGatewayWs()
  const play = useNotificationSoundStore(state => state.play)
  const queryClient = useQueryClient()
  const { cleanup } = useWebRTC()

  const {
    setConnectionStatus,
    setIsCurrentPeerConnected,
    setIsOtherPeerConnected,
  } = useOneToOneCallStore(
    state => ({
      setConnectionStatus: state.setConnectionStatus,
      setIsCurrentPeerConnected: state.setIsCurrentPeerConnected,
      setIsOtherPeerConnected: state.setIsOtherPeerConnected,
    }),
    shallow,
  )

  const endCall = useCallback(
    (playAudio: boolean = true) => {
      cleanup()
      setIsCurrentPeerConnected(false)
      setIsOtherPeerConnected(false)

      if (playAudio) {
        play('/sounds/ended-call.mp3')
      }
    },
    [cleanup, play, setIsCurrentPeerConnected, setIsOtherPeerConnected],
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
            setConnectionStatus('idle')
            endCall(false)
            return
          }

          play('/sounds/call-sound.mp3')
          setConnectionStatus('connected')
          updateDmLastInteraction({ id: event.dm })
        },
      ),

      conn.addListener<MaybeError<VoiceCallAnswer>>(
        'voice_call_answer',
        event => {
          if (event.err) {
            setConnectionStatus('idle')
            endCall(false)
            return
          }

          play('/sounds/joined-call.mp3')
        },
      ),

      conn.addListener<MaybeError<1>>('voice_call_ended', () => {
        endCall()
        setConnectionStatus('idle')
      }),

      conn.addListener('voice_call_answer_good', () => {
        play('/sounds/joined-call.mp3')
        setConnectionStatus('connected')
      }),

      conn.addListener('voice_call_offer_good', () => {
        play('/sounds/call-sound.mp3', { loop: true })
        setConnectionStatus('connected')
      }),
    ]

    return () => {
      unsubs.forEach(u => u())
    }
  }, [
    cleanup,
    conn,
    endCall,
    play,
    setConnectionStatus,
    setIsCurrentPeerConnected,
    setIsOtherPeerConnected,
    updateDmLastInteraction,
  ])
}

export function MainWsHandler() {
  useMainWsHandler()
  return null
}
