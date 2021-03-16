import sendDirectMessageFql from '@/fauna/mutations/sendDirectMessage'
import getDirectMessageFql from '@/fauna/queries/directMessage'
import {
  DirectMessageDetails,
  DirectMessageStatus,
  NewMessage,
} from '@/lib/types/messages'
import { useFauna } from '@/lib/useFauna'
import useFaunaQuery from '@/lib/useFaunaQuery'
import { nanoid } from 'nanoid'
import { FormEventHandler, KeyboardEvent, useRef, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { ChannelComponentProps } from '.'
import 'twin.macro'
import { differenceInSeconds } from 'date-fns'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import '@reach/dialog/styles.css'

function ChannelTextArea({ channel, dm }: ChannelComponentProps) {
  const [message, setMessage] = useState('')
  const { client, accessToken } = useFauna()
  const queryClient = useQueryClient()
  const lastMessageSentAt = useRef<Date>()
  const [isSpamDialogOpen, setIsSpamDialogOpen] = useState(false)
  const { data } = useFaunaQuery<DirectMessageDetails>({
    queryKey: ['dm', dm],
    fql: getDirectMessageFql(dm, channel),
    staleTime: Infinity,
  })

  const mutation = useMutation<
    { rateLimitTimestamp: string },
    unknown,
    NewMessage
  >(
    async newMessage => {
      const res = await client.query<string | { rateLimitTimestamp: string }>(
        sendDirectMessageFql(newMessage, channel),
        {
          secret: accessToken,
        },
      )

      if (typeof res === 'string') {
        throw new Error(res)
      }

      return res
    },
    {
      onSuccess: data => {
        console.log(data)
        lastMessageSentAt.current = new Date(data.rateLimitTimestamp)
      },
      onError: (_error, failedMessage) => {
        queryClient.setQueryData<DirectMessageDetails>(['dm', dm], existing => {
          return {
            ...existing!,
            messages: {
              data: existing!.messages.data.map(message => {
                if (message.nonce === failedMessage.nonce) {
                  return {
                    ...message,
                    status: DirectMessageStatus.FAILED,
                  }
                }

                return message
              }),
              before: existing!.messages.before,
              after: existing!.messages.after,
            },
          }
        })
      },
    },
  )

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

    queryClient.setQueryData<DirectMessageDetails>(['dm', dm], existing => {
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
    })

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
