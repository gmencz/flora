import { createClient } from '@/lib/FaunaClient'
import { DirectMessage, DirectMessageDetails } from '@/lib/types/messages'
import { useFauna } from '@/hooks/useFauna'
import { Collection, Ref } from 'faunadb'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useQueryClient } from 'react-query'
import { ChannelComponentProps } from '.'
import Message from './Message'
import 'twin.macro'
import { useDirectMessageQuery } from '@/hooks/useDirectMessageQuery'

function ChannelMessages({ channel, dm }: ChannelComponentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { accessToken } = useFauna()
  const queryClient = useQueryClient()
  const { data, isSuccess } = useDirectMessageQuery({ channel, dm })

  useEffect(() => {
    const streamClient = createClient(accessToken)
    const stream = streamClient.stream(Ref(Collection('channels'), channel))

    const startStream = () => {
      stream
        .on('version', event => {
          const { document } = event as any
          const { data } = document as {
            data: { latestMessage: DirectMessage }
          }
          queryClient.setQueryData<DirectMessageDetails>(
            ['dm', dm],
            existing => {
              const isMessageInQueue = existing!.messages.data.find(
                message => message.nonce === data.latestMessage.nonce,
              )

              return {
                ...existing!,
                messages: {
                  ...existing!.messages,
                  data: isMessageInQueue
                    ? existing!.messages.data.map(message => {
                        if (message.nonce === data.latestMessage.nonce) {
                          return data.latestMessage
                        }

                        return message
                      })
                    : [...existing!.messages.data, data.latestMessage],
                },
              }
            },
          )
        })
        .on('error', error => {
          console.log('STREAM ERROR', error)
          stream.close()
          setTimeout(startStream, 1000)
        })
        .start()
    }

    startStream()

    return () => {
      stream.close()
    }
  }, [accessToken, channel, dm, queryClient])

  useLayoutEffect(() => {
    if (data && data.messages.data.length > 0) {
      messagesEndRef.current?.scrollIntoView()
    }
  }, [data])

  return (
    <>
      <ul tw="py-6">
        {isSuccess && data?.messages.data.length === 0 && (
          <p tw="px-6 text-sm text-gray-900">
            Be the one to start the conversation!
          </p>
        )}

        {data?.messages.data.map((message, index, messages) => (
          <li key={message.nonce}>
            <Message
              dm={dm}
              message={message}
              previousMessage={messages[index - 1]}
            />
          </li>
        ))}
      </ul>
      <div ref={messagesEndRef} />
    </>
  )
}

export default ChannelMessages
