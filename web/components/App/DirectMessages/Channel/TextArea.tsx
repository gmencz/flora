import { nanoid } from 'nanoid'
import { FormEventHandler, KeyboardEvent, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import { ChannelComponentProps } from '.'
import { differenceInSeconds } from 'date-fns'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import { useSendDirectMessageMutation } from '@/hooks/useSendDirectMessageMutation'
import '@reach/dialog/styles.css'
import 'twin.macro'
import { useDirectMessageQuery } from '@/hooks/useDirectMessageQuery'
import { DirectMessagePayload } from '@/api/directMessages/channels/[channel]/[dm]'
import { DirectMessageStatus } from '@/api/directMessages/channels/[channel]'

function ChannelTextArea({ channel, dm }: ChannelComponentProps) {
  const { data } = useDirectMessageQuery({ channel, dm })
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()
  const lastMessageSentAt = useRef<Date>()
  const [isSpamDialogOpen, setIsSpamDialogOpen] = useState(false)

  const mutation = useSendDirectMessageMutation()

  const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.shiftKey === false) {
      event.preventDefault()
      sendMessage()
    }
  }

  const sendMessage = () => {
    if (lastMessageSentAt.current) {
      const secondsSinceLastMessage = differenceInSeconds(
        new Date(),
        lastMessageSentAt.current,
      )

      if (secondsSinceLastMessage < 1) {
        setIsSpamDialogOpen(true)
        return
      }
    }

    const nonce = nanoid()

    queryClient.setQueryData<DirectMessagePayload>(['dm', dm], existing => {
      return {
        ...existing!,
        messages: {
          ...existing!.messages,
          data: [
            ...existing!.messages.data,
            {
              content: message,
              nonce,
              timestamp: new Date().toISOString(),
              user: data!.currentUser,
              status: DirectMessageStatus.IN_QUEUE,
            },
          ],
        },
      }
    })

    mutation.mutate({
      content: message,
      nonce,
      channel,
      dm,
    })

    lastMessageSentAt.current = new Date()
    setMessage('')
  }

  const onSubmit: FormEventHandler<HTMLFormElement> = event => {
    event.preventDefault()
    sendMessage()
  }

  return (
    <>
      <div tw="sticky bottom-0 p-4 mt-auto bg-gray-100">
        <form onSubmit={onSubmit}>
          <textarea
            value={message}
            onChange={event => setMessage(event.target.value)}
            onKeyPress={submitOnEnter}
            tw="w-full p-4"
          />
        </form>
      </div>

      <DialogOverlay
        tw="z-50"
        isOpen={isSpamDialogOpen}
        onDismiss={() => setIsSpamDialogOpen(false)}
      >
        <DialogContent
          aria-label="Sending messages too fast"
          tw="bg-gray-200 w-full max-w-lg rounded-md text-center space-y-4 flex flex-col"
        >
          <p tw="font-semibold text-gray-800">
            You can't send more than 1 message every second!
          </p>
          <button
            tw="p-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 font-semibold text-white rounded-md bg-brand-600 hover:bg-brand-700"
            onClick={() => setIsSpamDialogOpen(false)}
          >
            Got it
          </button>
        </DialogContent>
      </DialogOverlay>
    </>
  )
}

export default ChannelTextArea
