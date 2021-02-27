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
import { formatDistanceToNow, parseISO } from 'date-fns'
import { nanoid } from 'nanoid'

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
  sentAt: string
  status: MessageStatus
}

interface LastMessageState {
  fromSubscription: string | null
  fromCache: string | null
}

async function fetchLatestMessages(): Promise<Message[]> {
  const data = await graphql.request<
    LatestMessagesQuery,
    LatestMessagesQueryVariables
  >(LatestMessagesDocument)

  return data.messages.reverse().map(message => ({
    id: message.id,
    content: message.content,
    guestName: message.guest_name,
    sentAt: message.sent_at,
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
  const isNewMessageRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [guestName, setGuestName] = useState<null | string>(null)
  const [lastMessage, setLastMessage] = useState<LastMessageState>({
    fromSubscription: null,
    fromCache: null,
  })

  const messagesQuery = useSubscription<
    Message[],
    ClientError,
    OnNewMessageSubscription
  >('Messages', fetchLatestMessages, {
    staleTime: Infinity,
    enabled: !!guestName,
    wsUrl: process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT!,
    subscription: {
      operationName: 'OnNewMessage',
      query: OnNewMessageDocument,
    },
    onData: data => {
      if (!isNewMessageRef.current) {
        isNewMessageRef.current = true
        return
      }

      const [newMessage] = data.messages

      queryClient.setQueryData<Message[]>('Messages', currentMessages => {
        // Here we look for a message that may be in cache.
        // If it's in cache this means the user sent this message
        // therefore we do not want to re-cache this already
        // cached message.
        const isOwnMessage = currentMessages?.find(
          message => message.id === newMessage.id,
        )

        if (isOwnMessage) {
          return currentMessages ?? []
        }

        return [
          ...(currentMessages ?? []),
          {
            id: newMessage.id,
            content: newMessage.content,
            guestName: newMessage.guest_name,
            sentAt: newMessage.sent_at,
            status: MessageStatus.DELIVERED,
          },
        ]
      })

      setLastMessage(current => ({
        ...current,
        fromSubscription: newMessage.id,
      }))
    },
  })

  const {
    register,
    handleSubmit,
    errors,
    reset: resetForm,
  } = useForm<FormInputs>({
    resolver: yupResolver(schema),
  })

  const onSubmit = (data: FormInputs) => {
    queryClient.setQueryData<Message[]>('Messages', currentMessages => [
      ...(currentMessages ?? []),
      {
        id: nanoid(),
        sentAt: new Date().toISOString(),
        content: data.content,
        guestName: guestName ?? 'Anonymous',
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

  const newMessageMutation = useNewMessageMutation<ClientError>(graphql, {
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

      setLastMessage(current => ({
        ...current,
        fromCache: input.id!,
      }))
    },
    onSuccess: data => {
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

      setLastMessage(current => ({
        ...current,
        fromCache: data.insert_messages_one!.id,
      }))
    },
  })

  useEffect(() => {
    if (
      messagesQuery.data &&
      messagesQuery.data.length > 0 &&
      !newMessageMutation.isLoading &&
      lastMessage.fromCache === lastMessage.fromSubscription
    ) {
      const firstMessageInQueue = messagesQuery.data.find(
        message => message.status === MessageStatus.IN_QUEUE,
      )

      if (!firstMessageInQueue) {
        return
      }

      newMessageMutation.mutate({
        input: {
          id: firstMessageInQueue.id,
          guest_name: firstMessageInQueue.guestName,
          content: firstMessageInQueue.content,
          sent_at: firstMessageInQueue.sentAt,
        },
      })
    }
  }, [
    lastMessage.fromCache,
    lastMessage.fromSubscription,
    messagesQuery.data,
    newMessageMutation,
  ])

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
                        {formatDistanceToNow(parseISO(message.sentAt), {
                          addSuffix: true,
                        })}
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
          <p className="mb-2 text-sm text-red-600">
            {newMessageMutation.isError
              ? newMessageMutation.error?.message
              : errors.content?.message}
          </p>
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
              disabled={newMessageMutation.isLoading}
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
