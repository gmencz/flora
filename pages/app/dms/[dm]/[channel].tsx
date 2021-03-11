import DMsSidebar from '@/components/DMs/Sidebar'
import Message from '@/components/Message'
import ServersSidebar from '@/components/Servers/Sidebar'
import withAuthenticationRequired from '@/components/withAuthenticationRequired'
import { createClient, useFauna } from '@/lib/fauna'
import { Page } from '@/lib/types'
import getDmFql from 'fauna/queryManager/fql/dm'
import { sendMessageToChannelFql } from 'fauna/queryManager/fql/message'
import useFaunaQuery from 'fauna/queryManager/useFaunaQuery'
import { Collection, Ref } from 'faunadb'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/router'
import {
  FormEventHandler,
  KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useMutation, useQueryClient } from 'react-query'

interface DMUser {
  id: string
  name: string
  photo: string
}

export interface DMMessage {
  timestamp: string
  nonce: string
  content: string
  status: MessageStatus
  user: DMUser
}

interface DMDetails {
  currentUser: DMUser
  withUser: DMUser
  messages: Page<DMMessage>
}

export enum MessageStatus {
  FAILED,
  IN_QUEUE,
  DELIVERED,
}

export type NewMessage = Pick<DMMessage, 'content' | 'nonce'>

function DM() {
  const router = useRouter()
  const { channel, dm } = router.query as Record<string, string>
  const { client, getAccessToken } = useFauna()
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mutation = useMutation<unknown, unknown, NewMessage>(
    newMessage => {
      return client.query(sendMessageToChannelFql(newMessage, channel), {
        secret: getAccessToken(),
      })
    },
    {
      onError: (_error, failedMessage) => {
        queryClient.setQueryData<DMDetails>(['dm', dm], existing => {
          return {
            ...existing!,
            messages: {
              data: existing!.messages.data.map(message => {
                if (message.nonce === failedMessage.nonce) {
                  return {
                    ...message,
                    status: MessageStatus.FAILED,
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

  const queryClient = useQueryClient()

  const { data } = useFaunaQuery<DMDetails>({
    queryKey: ['dm', dm],
    fql: getDmFql(dm, channel),
    staleTime: Infinity,
  })

  useEffect(() => {
    const subscriptionClient = createClient(getAccessToken())
    const stream = subscriptionClient.stream(
      Ref(Collection('channels'), channel),
    )

    const startStream = () => {
      stream
        .on('version', event => {
          const { document } = event as any
          const { data } = document as { data: { latestMessage: DMMessage } }
          queryClient.setQueryData<DMDetails>(['dm', dm], existing => {
            const isMessageInQueue = existing!.messages.data.find(
              message => message.nonce === data.latestMessage.nonce,
            )

            return {
              ...existing!,
              messages: {
                data: isMessageInQueue
                  ? existing!.messages.data.map(message => {
                      if (message.nonce === data.latestMessage.nonce) {
                        return data.latestMessage
                      }

                      return message
                    })
                  : [...existing!.messages.data, data.latestMessage],
                before: existing!.messages.before,
                after: existing!.messages.after,
              },
            }
          })
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
  }, [channel, dm, getAccessToken, queryClient])

  const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.shiftKey === false) {
      event.preventDefault()
      sendMessage()
    }
  }

  const sendMessage = () => {
    const nonce = nanoid()
    queryClient.setQueryData<DMDetails>(['dm', dm], existing => {
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
              status: MessageStatus.IN_QUEUE,
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

  useLayoutEffect(() => {
    if (data && data.messages.data.length > 0) {
      messagesEndRef.current?.scrollIntoView()
    }
  }, [data])

  const onSubmit: FormEventHandler<HTMLFormElement> = event => {
    event.preventDefault()
    sendMessage()
  }

  return (
    <div className="flex">
      <ServersSidebar />

      <DMsSidebar />

      <div className="flex-1 flex flex-col">
        <header className="py-4 sticky top-0 px-6 bg-gray-100 shadow-sm">
          <div className="flex space-x-2.5 items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
            <span className="text-sm font-bold text-gray-900">
              {data?.withUser.name}
            </span>
          </div>
        </header>
        <ul className="p-6">
          {data?.messages.data.map((message, index, messages) => (
            <li key={message.nonce}>
              <Message
                message={message}
                previousMessage={messages[index - 1]}
              />
            </li>
          ))}
        </ul>
        <div ref={messagesEndRef} />

        <div className="sticky bottom-0 p-4 mt-auto bg-gray-100">
          <form onSubmit={onSubmit}>
            <textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              onKeyPress={submitOnEnter}
              className="w-full"
            />
          </form>
        </div>
      </div>
    </div>
  )
}

export default withAuthenticationRequired(DM)
