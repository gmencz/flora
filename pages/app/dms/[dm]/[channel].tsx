import DMsSidebar from '@/components/DMs/Sidebar'
import ServersSidebar from '@/components/Servers/Sidebar'
import withAuthenticationRequired from '@/components/withAuthenticationRequired'
import { createClient, useFauna } from '@/lib/fauna'
import { Page } from '@/lib/types'
import formatMessageTimestamp from '@/util/formatMessageTimestamp'
import getDmFql from 'fauna/queryManager/fql/dm'
import { sendMessageToChannelFql } from 'fauna/queryManager/fql/message'
import useFaunaQuery from 'fauna/queryManager/useFaunaQuery'
import { Collection, Ref } from 'faunadb'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/router'
import { FormEventHandler, KeyboardEvent, useEffect, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'

interface DMUser {
  id: string
  name: string
  photo: string
}

interface DMMessage {
  timestamp: string
  nonce: string
  content: string
  user: DMUser
}

interface DMDetails {
  withUser: DMUser
  messages: Page<DMMessage>
}

export type NewMessage = Pick<DMMessage, 'content' | 'nonce'>

function DM() {
  const router = useRouter()
  const { channel, dm } = router.query as Record<string, string>
  const { client, getAccessToken } = useFauna()
  const [message, setMessage] = useState('')
  const mutation = useMutation<unknown, unknown, NewMessage>(newMessage => {
    return client.query(sendMessageToChannelFql(newMessage, channel), {
      secret: getAccessToken(),
    })
  })

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
            return {
              ...existing!,
              messages: {
                ...existing!.messages,
                data: [...existing!.messages.data, data.latestMessage],
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
    mutation.mutate({
      content: message,
      nonce: nanoid(),
    })
  }

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
        <section className="px-6 py-4 space-y-4">
          {data?.messages.data.map(message => (
            <div key={message.nonce} className="flex items-center space-x-4">
              <img
                src={message.user.photo}
                alt={message.user.name}
                className="h-9 w-9 rounded-full"
              />

              <div className="flex flex-col flex-1 space-y-0.5">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-semibold text-gray-900">
                    {message.user.name}
                  </span>
                  <time
                    className="text-xs text-gray-600"
                    dateTime={message.timestamp}
                  >
                    {formatMessageTimestamp(message.timestamp)}
                  </time>
                </div>

                <p className="text-sm text-gray-900 break-all">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </section>

        <div className="p-4 mt-auto">
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
