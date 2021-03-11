import formatMessageTimestamp from '@/util/formatMessageTimestamp'
import clsx from 'clsx'
import { parseISO, differenceInMinutes } from 'date-fns'
import { DMMessage, MessageStatus } from 'pages/app/dms/[dm]/[channel]'
import { useMemo } from 'react'

interface MessageProps {
  previousMessage: DMMessage | undefined
  message: DMMessage
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
        <div className="flex items-center space-x-4 mt-0.5">
          {/* Just a dummy div for creating the same spacing that unrelated messages create */}
          <div className="w-9" />
          <p
            className={clsx(
              'text-sm break-all transition-colors',

              message.status === MessageStatus.IN_QUEUE
                ? 'text-gray-400'
                : message.status === MessageStatus.DELIVERED
                ? 'text-gray-900'
                : 'text-red-600',
            )}
          >
            {message.content}
          </p>
        </div>
      ) : (
        <div
          className={clsx(
            'flex items-center space-x-4',
            !!previousMessage && 'mt-5',
          )}
        >
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

            <p
              className={clsx(
                'text-sm break-all transition-colors',

                message.status === MessageStatus.IN_QUEUE
                  ? 'text-gray-400'
                  : message.status === MessageStatus.DELIVERED
                  ? 'text-gray-900'
                  : 'text-red-600',
              )}
            >
              {message.content}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
