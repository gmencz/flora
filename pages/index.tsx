import {
  KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from 'react-query'
import {
  LatestMessagesDocument,
  LatestMessagesQuery,
  LatestMessagesQueryVariables,
  MessagesRangeDocument,
  MessagesRangeQuery,
  MessagesRangeQueryVariables,
  OnNewMessageDocument,
  OnNewMessageSubscription,
  useNewMessageMutation,
} from '../generated/graphql'
import graphql from '../utils/graphql'
import useSubscription from '../utils/useSubscription'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { ClientError } from 'graphql-request'
import GuestForm from '../components/GuestForm'
import { nanoid } from 'nanoid'
import uniquify from '../utils/uniquify'
import formatMessageTimestamp from '../utils/formatMessageTimestamp'

interface FormInputs {
  content: string
}

enum MessageStatus {
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  IN_QUEUE = 'IN_QUEUE',
}

interface Message {
  id: string
  content: string
  guestName: string
  createdAt?: string | null | undefined
  status: MessageStatus
}

async function fetchInitialMessages(): Promise<Message[]> {
  const data = await graphql.request<
    LatestMessagesQuery,
    LatestMessagesQueryVariables
  >(LatestMessagesDocument)

  return data.messages.map(message => ({
    id: message.id,
    content: message.content,
    guestName: message.guest_name,
    createdAt: message.created_at,
    status: MessageStatus.DELIVERED,
  }))
}

const schema = yup.object().shape({
  content: yup
    .string()
    .required("You can't send an empty message.")
    .max(1024, "Messages can't be longer than 1024 characters."),
})

function IndexPage() {
  const queryClient = useQueryClient()
  const isNewEventRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [guestName, setGuestName] = useState<null | string>(null)
  const latestMessageTsRef = useRef<string>()

  const messagesQuery = useSubscription<
    Message[],
    ClientError,
    OnNewMessageSubscription
  >('Messages', fetchInitialMessages, {
    staleTime: Infinity,
    enabled: !!guestName,
    wsUrl: process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT!,
    subscription: {
      operationName: 'OnNewMessage',
      query: OnNewMessageDocument,
    },
    onData: data => {
      const [latestMessage] = data.messages

      if (!latestMessage) {
        isNewEventRef.current = true
        return
      }

      if (isNewEventRef.current) {
        graphql
          .request<MessagesRangeQuery, MessagesRangeQueryVariables>(
            MessagesRangeDocument,
            {
              from: latestMessageTsRef.current,
              to: latestMessage.created_at,
            },
          )
          .then(latestMessages => {
            queryClient.setQueryData<Message[]>('Messages', currentMessages => {
              const merged = [
                ...(currentMessages ?? []),
                ...latestMessages.messages.map(message => ({
                  id: message.id,
                  content: message.content,
                  guestName: message.guest_name,
                  createdAt: message.created_at,
                  status: MessageStatus.DELIVERED,
                })),
              ]

              return uniquify(merged, 'id')
            })
          })
      } else {
        isNewEventRef.current = true
      }

      latestMessageTsRef.current = latestMessage.created_at!
    },
  })

  const { register, handleSubmit, reset: resetForm } = useForm<FormInputs>({
    resolver: yupResolver(schema),
  })

  const onSubmit = (data: FormInputs) => {
    queryClient.setQueryData<Message[]>('Messages', currentMessages => [
      ...(currentMessages ?? []),
      {
        id: nanoid(),
        content: data.content,
        guestName: guestName!,
        createdAt: new Date().toISOString(),
        status: MessageStatus.IN_QUEUE,
      },
    ])

    resetForm()
  }

  const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.shiftKey === false) {
      event.preventDefault()
      handleSubmit(onSubmit)()
    }
  }

  useLayoutEffect(() => {
    if (messagesQuery.data && messagesQuery.data.length > 0) {
      messagesEndRef.current?.scrollIntoView()
    }
  }, [messagesQuery.data])

  const { mutate: sendMessage, variables } = useNewMessageMutation<ClientError>(
    graphql,
    {
      onError: (_, { input }) => {
        queryClient.setQueryData<Message[]>('Messages', currentMessages => {
          return (
            currentMessages?.map(message => {
              if (message.id === input.id) {
                return {
                  ...message,
                  status: MessageStatus.FAILED,
                }
              }

              return message
            }) ?? []
          )
        })
      },
      onSuccess: data => {
        if (data.insert_messages_one) {
          queryClient.setQueryData<Message[]>('Messages', currentMessages => {
            return (
              currentMessages?.map(message => {
                if (message.id === data.insert_messages_one?.id) {
                  return {
                    ...message,
                    status: MessageStatus.DELIVERED,
                  }
                }

                return message
              }) ?? []
            )
          })
        }
      },
    },
  )

  useEffect(() => {
    if (messagesQuery.data && messagesQuery.data.length > 0) {
      const firstMessageInQueue = messagesQuery.data.find(
        message =>
          message.status === MessageStatus.IN_QUEUE &&
          message.id !== variables?.input.id,
      )

      if (!firstMessageInQueue) {
        return
      }

      sendMessage({
        input: {
          id: firstMessageInQueue.id,
          content: firstMessageInQueue.content,
          guest_name: firstMessageInQueue.guestName,
        },
      })
    }
  }, [messagesQuery.data, sendMessage, variables?.input.id])

  if (!guestName) {
    return <GuestForm setGuestName={setGuestName} />
  }

  return (
    <div className="w-full max-w-xl mx-auto min-h-screen flex flex-col">
      <div className="pt-12 border-b border-gray-200 pb-4 sticky top-0 bg-white">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Chatskee
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Chat with everyone from anywhere!
        </p>
      </div>
      {messagesQuery.isLoading && (
        <div className="mt-4 flex items-center justify-center">
          <span className="sr-only">loading latest messages...</span>
          <svg
            className="h-6 w-6 animate-spin text-green-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}

      {messagesQuery.isError && (
        <div className="mt-4">
          <p className="text-sm text-red-600">{messagesQuery.error.message}</p>
        </div>
      )}

      {messagesQuery.isSuccess && (
        <>
          <ul className="mt-2 divide-y divide-gray-200">
            {messagesQuery.data.map(message => (
              <li className="py-4" key={message.id}>
                <div className="flex space-x-3 break-all">
                  <img
                    className="h-6 w-6 rounded-full"
                    src="https://res.cloudinary.com/ds9ttumx0/image/upload/v1614296913/chatskee/default_yjml9c_ne1c6w.png"
                    alt=""
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {message.guestName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatMessageTimestamp(message.createdAt!)}
                      </p>
                    </div>

                    <p className="text-sm text-gray-500">
                      {message.status} - {message.content}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div ref={messagesEndRef} />
        </>
      )}

      <div className="sticky mt-auto bottom-0 bg-white pb-8 pt-4 max-w-xl w-full">
        <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-start">
            <textarea
              onKeyPress={submitOnEnter}
              name="content"
              rows={2}
              ref={register}
              placeholder="Start a new message"
              className="resize-none shadow-sm block flex-1 focus:ring-green-500 focus:border-green-500 sm:text-sm border-gray-300 rounded-md"
            ></textarea>
            <button
              type="submit"
              className="p-1.5 flex items-center justify-center rounded-full ml-4 text-green-500 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-green-500"
            >
              <svg
                className="h-6 w-6 transform rotate-90"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Everyone will be able to see it.
          </p>
        </form>
      </div>
    </div>
  )
}

export default IndexPage
