import { DirectMessage, DirectMessageStatus } from '@/lib/types/messages'
import formatMessageTimestamp from '@/util/formatMessageTimestamp'
import { parseISO, differenceInMinutes } from 'date-fns'
import { useMemo } from 'react'
import 'twin.macro'
import tw from 'twin.macro'

interface MessageProps {
  previousMessage: DirectMessage | undefined
  message: DirectMessage
}

export default function Message({ message, previousMessage }: MessageProps) {
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

  return (
    <>
      {isRelatedMessage ? (
        <div tw="flex items-center space-x-4 mt-0.5">
          {/* Just a dummy div for creating the same spacing that unrelated messages create */}
          <div tw="w-9" />
          <p
            css={[
              tw`text-sm break-all transition-colors`,

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
          css={[tw`flex items-start space-x-4`, !!previousMessage && tw`mt-5`]}
        >
          <img
            src={message.user.photo}
            alt={message.user.name}
            tw="h-9 w-9 rounded-full"
          />

          <div tw="flex flex-col flex-1 space-y-0.5">
            <div tw="flex items-center space-x-4">
              <span tw="text-sm font-semibold text-gray-900">
                {message.user.name}
              </span>
              <time tw="text-xs text-gray-600" dateTime={message.timestamp}>
                {formatMessageTimestamp(message.timestamp)}
              </time>
            </div>

            <p
              css={[
                tw`text-sm break-all transition-colors`,

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
          </div>
        </div>
      )}
    </>
  )
}
