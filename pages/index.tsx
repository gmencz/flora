import { distanceInWordsToNow } from 'date-fns'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from 'react-query'
import {
  LatestMessagesDocument,
  LatestMessagesQuery,
  LatestMessagesQueryVariables,
  OnNewMessageDocument,
  useNewMessageMutation,
} from '../generated/graphql'
import graphql from '../utils/graphql'
import useSubscription from '../utils/useSubscription'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { ClientError } from 'graphql-request'
import GuestForm from '../components/GuestForm'

interface FormInputs {
  content: string
}

async function fetchLatestMessages() {
  return graphql.request<LatestMessagesQuery, LatestMessagesQueryVariables>(
    LatestMessagesDocument,
  )
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
  const [guestName, setGuestName] = useState<null | string>(null)
  const latestMessagesQuery = useSubscription<LatestMessagesQuery, ClientError>(
    'LatestMessages',
    fetchLatestMessages,
    {
      staleTime: Infinity,
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

        queryClient.setQueryData<LatestMessagesQuery>(
          'LatestMessages',
          existing => {
            if (!existing) {
              return {
                messages: data.messages,
              }
            }

            const [newMessage] = data.messages
            return {
              messages: [newMessage, ...existing.messages],
            }
          },
        )
      },
    },
  )

  const { register, handleSubmit, errors, reset } = useForm<FormInputs>({
    resolver: yupResolver(schema),
  })

  const newMessageMutation = useNewMessageMutation<ClientError>(graphql, {
    onSuccess: () => {
      reset()
    },
  })

  const onSubmit = (data: FormInputs) => {
    newMessageMutation.mutate({
      input: {
        sent_at: new Date().toISOString(),
        content: data.content,
        guest_name: guestName,
      },
    })
  }

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
      {latestMessagesQuery.isLoading && (
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

      {latestMessagesQuery.isError && (
        <div className="mt-4">
          <p className="text-sm text-red-600">
            {latestMessagesQuery.error.message}
          </p>
        </div>
      )}

      {latestMessagesQuery.isSuccess && (
        <ul className="mt-2 divide-y divide-gray-200">
          {latestMessagesQuery.data?.messages.map(message => (
            <li className="py-4" key={message.id}>
              <div className="flex space-x-3">
                <img
                  className="h-6 w-6 rounded-full"
                  src="https://res.cloudinary.com/ds9ttumx0/image/upload/v1614296913/chatskee/default_yjml9c_ne1c6w.png"
                  alt=""
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      {message.guest_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {distanceInWordsToNow(message.sent_at, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">{message.content}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="sticky mt-auto bottom-0 bg-white pb-8 pt-4 max-w-xl w-full">
        <form onSubmit={handleSubmit(onSubmit)}>
          <p className="mb-2 text-sm text-red-600">
            {newMessageMutation.isError
              ? newMessageMutation.error?.message
              : errors.content?.message}
          </p>
          <div className="flex items-start">
            <textarea
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
              {newMessageMutation.isLoading ? (
                <>
                  <span className="sr-only">sending...</span>
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
                </>
              ) : (
                <svg
                  className="h-6 w-6 transform rotate-90"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
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
