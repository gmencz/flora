import { DirectMessagesPayload } from '@/api/directMessages'
import { useGatewayWs } from '@/hooks/useGatewayWs'
import { useNotificationSoundStore } from '@/hooks/useNotificationSoundStore'
import { useUpdateDmLastInteraction } from '@/hooks/useUpdateDmLastInteraction'
import { MaybeError } from '@/lib/types'
import { VoiceCallAnswer, VoiceCallOffer } from '@chatskee/gateway'
import { ReactNode, useEffect } from 'react'
import { useQueryClient } from 'react-query'

interface MainWsHandlerProviderProps {
  children: ReactNode
}

export function useMainWsHandler() {
  const conn = useGatewayWs()
  const play = useNotificationSoundStore(state => state.play)
  const stopCallSoundNotification = useNotificationSoundStore(
    state => state.stop,
  )
  const queryClient = useQueryClient()
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

      play('/sounds/call-sound.mp3', { loop: true })
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

          updateDmLastInteraction({ id: event.dm })
        },
      ),

      conn.addListener<MaybeError<VoiceCallAnswer>>(
        'voice_call_answer',
        event => {
          if (event.err) {
            return
          }

          // We will only get here when the callee answers the call
          // so we can assume success
          stopCallSoundNotification()
        },
      ),
    ]

    return () => {
      unsubs.forEach(u => u())
    }
  }, [conn, play, stopCallSoundNotification, updateDmLastInteraction])
}

export function MainWsHandlerProvider({
  children,
}: MainWsHandlerProviderProps) {
  useMainWsHandler()
  return <>{children}</>
}
