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
import { FormEventHandler, KeyboardEvent, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { ChannelComponentProps } from '.'
import 'twin.macro'

function ChannelTextArea({ channel, dm }: ChannelComponentProps) {
  const [message, setMessage] = useState('')
  const { client, getAccessToken } = useFauna()
  const queryClient = useQueryClient()
  const { data } = useFaunaQuery<DirectMessageDetails>({
    queryKey: ['dm', dm],
    fql: getDirectMessageFql(dm, channel),
    staleTime: Infinity,
  })

  const mutation = useMutation<unknown, unknown, NewMessage>(
    newMessage => {
      return client.query(sendDirectMessageFql(newMessage, channel), {
        secret: getAccessToken(),
      })
    },
    {
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
  }

  const onSubmit: FormEventHandler<HTMLFormElement> = event => {
    event.preventDefault()
    sendMessage()
  }

  return (
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
  )
}

export default ChannelTextArea
