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
import Message from '../components/Message'

interface FormInputs {
  content: string
}

export enum MessageStatus {
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  IN_QUEUE = 'IN_QUEUE',
}

export interface IMessage {
  content: string
  guestId: string
  guestName: string
  timestamp?: string | null | undefined
  nonce: string
  status: MessageStatus
}

async function fetchInitialMessages(): Promise<IMessage[]> {
  const data = await graphql.request<
    LatestMessagesQuery,
    LatestMessagesQueryVariables
  >(LatestMessagesDocument)

  return data.messages.map(message => ({
    content: message.content,
    guestId: message.guest_id,
    guestName: message.guest_name,
    timestamp: message.timestamp,
    nonce: message.nonce,
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
  const [guest, setGuest] = useState<null | { id: string; name: string }>(null)
  const latestMessageTsRef = useRef<string>()

  const messagesQuery = useSubscription<
    IMessage[],
    ClientError,
    OnNewMessageSubscription
  >('Messages', fetchInitialMessages, {
    staleTime: Infinity,
    enabled: !!guest,
    wsUrl: process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT!,
    subscription: {
      operationName: 'OnNewMessage',
      query: OnNewMessageDocument,
    },
    onData: data => {
      const [latestMessage] = data.messages

      if (!latestMessage) {
        // If there's no latest message this means there's no messages
        // at all so we'll set the messages cache to an empty array.
        queryClient.setQueryData<IMessage[]>('Messages', [])
        isNewEventRef.current = true
        return
      }

      if (isNewEventRef.current) {
        // If the latest message is in the cache, we don't need to refetch
        // latest messages which lets us skip a lot of unnecessary requests.
        const currentMessages = queryClient.getQueryData<IMessage[]>('Messages')
        if (
          currentMessages?.some(
            message => message.nonce === latestMessage.nonce,
          )
        ) {
          return
        }

        graphql
          .request<MessagesRangeQuery, MessagesRangeQueryVariables>(
            MessagesRangeDocument,
            {
              from: latestMessageTsRef.current,
              to: latestMessage.timestamp,
            },
          )
          .then(latestMessages => {
            queryClient.setQueryData<IMessage[]>(
              'Messages',
              currentMessages => [
                ...(currentMessages ?? []),
                ...latestMessages.messages.map(message => ({
                  content: message.content,
                  guestId: message.guest_id,
                  guestName: message.guest_name,
                  timestamp: message.timestamp,
                  nonce: message.nonce,
                  status: MessageStatus.DELIVERED,
                })),
              ],
            )
          })
      } else {
        isNewEventRef.current = true
      }

      latestMessageTsRef.current = latestMessage.timestamp!
    },
  })

  const { register, handleSubmit, reset: resetForm } = useForm<FormInputs>({
    resolver: yupResolver(schema),
  })

  const onSubmit = (data: FormInputs) => {
    queryClient.setQueryData<IMessage[]>('Messages', currentMessages => [
      ...(currentMessages ?? []),
      {
        content: data.content,
        guestName: guest!.name,
        guestId: guest!.id,
        timestamp: new Date().toISOString(),
        nonce: nanoid(),
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

  const { mutate: sendMessage } = useNewMessageMutation<ClientError>(graphql, {
    onError: (_, { input }) => {
      queryClient.setQueryData<IMessage[]>('Messages', currentMessages => {
        return (
          currentMessages?.map(message => {
            if (message.nonce === input.nonce) {
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
        queryClient.setQueryData<IMessage[]>('Messages', currentMessages => {
          return (
            currentMessages?.map(message => {
              if (message.nonce === data.insert_messages_one?.nonce) {
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
  })

  const [pendingMessagesIds, setPendingMessagesIds] = useState<string[]>([])

  useEffect(() => {
    if (messagesQuery.data && messagesQuery.data.length > 0) {
      const firstMessageInQueue = messagesQuery.data.find(
        message =>
          message.status === MessageStatus.IN_QUEUE &&
          !pendingMessagesIds.includes(message.nonce),
      )

      if (!firstMessageInQueue) {
        return
      }

      setPendingMessagesIds(previouslyPendingIds => [
        ...previouslyPendingIds,
        firstMessageInQueue.nonce,
      ])

      sendMessage({
        input: {
          nonce: firstMessageInQueue.nonce,
          content: firstMessageInQueue.content,
          guest_id: firstMessageInQueue.guestId,
          guest_name: firstMessageInQueue.guestName,
        },
      })
    }
  }, [messagesQuery.data, pendingMessagesIds, sendMessage])

  useEffect(() => {
    if (messagesQuery.data) {
      const areAllMessagesDelivered = queryClient
        .getQueryData<IMessage[]>('Messages')
        ?.every(message => message.status === MessageStatus.DELIVERED)

      if (areAllMessagesDelivered) {
        setPendingMessagesIds([])
      }
    }
  }, [messagesQuery.data, queryClient])

  if (!guest) {
    return <GuestForm setGuest={setGuest} />
  }

  return (
    <div className="px-4 w-full max-w-2xl mx-auto min-h-screen flex flex-col">
      <div className="pt-12 border-b border-gray-200 pb-4 sticky top-0 bg-white z-10">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Chatskee
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Chat with everyone from anywhere!{' '}
        </p>
        <span className="italic text-sm text-gray-400">
          Messages are deleted every 24 hours.
        </span>
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
          {messagesQuery.data.length === 0 && (
            <p className="text-sm mt-4 text-gray-500">
              Looks like nobody sent a message today, be the first one!
            </p>
          )}

          <ul className="mt-2 divide-y divide-gray-200">
            {messagesQuery.data.map(message => (
              <li className="py-4" key={message.nonce}>
                <Message message={message} />
              </li>
            ))}
          </ul>
          <div ref={messagesEndRef} />
        </>
      )}

      <div className="sticky mt-auto bottom-0 bg-white pb-8 pt-4 max-w-xl min-w-full z-10">
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
