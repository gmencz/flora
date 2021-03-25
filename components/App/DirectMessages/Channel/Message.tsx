import Tooltip from '@/components/ui/Tooltip'
import {
  DirectMessage,
  DirectMessageDetails,
  DirectMessageStatus,
} from '@/lib/types/messages'
import formatMessageTimestamp from '@/util/formatMessageTimestamp'
import { parseISO, differenceInMinutes, format } from 'date-fns'
import { useMemo } from 'react'
import { useQueryClient } from 'react-query'
import tw from 'twin.macro'

interface MessageProps {
  previousMessage: DirectMessage | undefined
  message: DirectMessage
  dm: string
}

export default function Message({
  message,
  previousMessage,
  dm,
}: MessageProps) {
  const queryClient = useQueryClient()
  const isRelatedMessage = useMemo(() => {
    // If there's no previous message or the previous message was sent
    // by another user then we don't consider the message related.
    if (!previousMessage || previousMessage.user.id !== message.user.id) {
      return false
    }

    const minutesDifference = differenceInMinutes(
      parseISO(message.timestamp),
      parseISO(previousMessage.timestamp),
    )

    // We consider messages sent <=15 minutes after
    // the last message and from the same user "related".
    const wasRecentlySent = minutesDifference <= 15
    return wasRecentlySent
  }, [message.timestamp, message.user.id, previousMessage])

  const onDismissInfoMessage = (nonce: string) => {
    queryClient.setQueryData<DirectMessageDetails>(['dm', dm], existing => {
      return {
        ...existing!,
        messages: {
          data: existing!.messages.data.filter(
            message => message.nonce !== nonce,
          ),
          before: existing!.messages.before,
          after: existing!.messages.after,
        },
      }
    })
  }

  return (
    <>
      {isRelatedMessage ? (
        <div
          className="group"
          tw="flex items-center space-x-2.5 py-1 px-6 hover:bg-gray-200 hover:bg-opacity-60"
        >
          {/* Just a dummy div for creating the same spacing that unrelated messages create */}
          <div tw="w-12">
            <time
              dateTime={message.timestamp}
              tw="font-size[0.6rem] hidden mt-0.5 text-gray-600 group-hover:flex"
            >
              {format(parseISO(message.timestamp), 'hh:mm a')}
            </time>
          </div>
          <p
            css={[
              tw`text-sm break-all transition-colors flex-1`,

              message.status === DirectMessageStatus.IN_QUEUE &&
                tw`text-gray-400`,

              message.status === DirectMessageStatus.DELIVERED &&
                tw`text-gray-900`,

              message.status === DirectMessageStatus.FAILED && tw`text-red-600`,
            ]}
          >
            {message.content}
          </p>
        </div>
      ) : (
        <div
          className="group"
          css={[
            tw`flex items-start space-x-2.5 py-1 px-6 hover:bg-gray-200 hover:bg-opacity-60`,
            !!previousMessage && tw`mt-5`,
            message.status === DirectMessageStatus.INFO &&
              tw`border-l-2 border-brand-600 bg-brand-100 bg-opacity-40`,
          ]}
        >
          <div tw="w-12">
            <img
              src={message.user.photo}
              alt={message.user.name}
              tw="h-10 w-10 rounded-full object-cover"
            />
          </div>

          <div tw="flex flex-col flex-1">
            <div tw="flex items-center">
              {message.status === DirectMessageStatus.INFO ? (
                <div tw="flex items-center space-x-2">
                  <span tw="text-sm font-semibold text-gray-900">
                    {message.user.name}
                  </span>

                  <div tw="relative">
                    <Tooltip label="Verified Bot" position="top">
                      <div tw="flex relative items-center space-x-1 bg-brand-600 px-1.5 py-0.5 text-white rounded">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          tw="h-3 w-3"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>

                        <span tw="uppercase font-size[0.6rem]">Bot</span>
                      </div>
                    </Tooltip>
                  </div>
                </div>
              ) : (
                <span tw="text-sm font-semibold text-gray-900">
                  {message.user.name}
                </span>
              )}

              <time
                tw="text-xs ml-4 text-gray-600"
                dateTime={message.timestamp}
              >
                <span>{formatMessageTimestamp(message.timestamp)}</span>
              </time>
            </div>

            <p
              css={[
                tw`text-sm break-all transition-colors mt-0.5`,

                message.status === DirectMessageStatus.IN_QUEUE &&
                  tw`text-gray-400`,

                message.status === DirectMessageStatus.DELIVERED &&
                  tw`text-gray-900`,

                message.status === DirectMessageStatus.FAILED &&
                  tw`text-red-600`,
              ]}
            >
              {message.content}
            </p>

            {message.status === DirectMessageStatus.INFO && (
              <div tw="flex mt-2 space-x-1.5 items-center">
                <small tw="flex items-center space-x-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    tw="w-3.5 h-3.5 text-gray-400"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>

                  <span tw="text-tiny text-gray-500 font-medium">
                    Only you can see this
                  </span>
                </small>

                <span tw="text-tiny text-gray-500">•</span>

                <button
                  onClick={() => onDismissInfoMessage(message.nonce)}
                  tw="text-tiny text-brand-600 font-semibold hover:underline"
                >
                  Dismiss message
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
