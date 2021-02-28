import clsx from 'clsx'
import { parseISO } from 'date-fns'
import { differenceInMinutes } from 'date-fns'
import Image from 'next/image'
import { useMemo } from 'react'
import { IMessage, MessageStatus } from '../pages/index'
import formatMessageTimestamp from '../utils/formatMessageTimestamp'

interface MessageProps {
  message: IMessage
  previousMessage: IMessage | null
  index: number
}

function Message({ message, previousMessage, index }: MessageProps) {
  const shouldShowDivider = useMemo(() => {
    if (!previousMessage) {
      return false
    }

    const minutesSincePreviousMessage = differenceInMinutes(
      parseISO(message.timestamp!),
      parseISO(previousMessage.timestamp!),
    )

    if (
      minutesSincePreviousMessage < 15 &&
      previousMessage.guestId === message.guestId
    ) {
      return false
    }

    return true
  }, [message.guestId, message.timestamp, previousMessage])

  return (
    <div
      className={clsx(
        'flex space-x-3 break-all',
        shouldShowDivider && 'border-t border-gray-200',
        shouldShowDivider || index === 0 ? 'pt-5 pb-5' : '-mt-4 mb-4',
      )}
    >
      {index === 0 || shouldShowDivider ? (
        <>
          <div className="self-start">
            <Image
              height={24}
              width={24}
              className="rounded-full"
              src="https://res.cloudinary.com/ds9ttumx0/image/upload/v1614296913/chatskee/default_yjml9c_ne1c6w.png"
              alt="Guest"
            />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{message.guestName}</h3>
              <p className="text-sm text-gray-500">
                {formatMessageTimestamp(message.timestamp!)}
              </p>
            </div>

            <p
              className={clsx(
                'text-sm',

                message.status === MessageStatus.IN_QUEUE && 'text-gray-300',

                message.status === MessageStatus.DELIVERED && 'text-gray-500',

                message.status === MessageStatus.FAILED && 'text-red-500',
              )}
            >
              {message.content}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="w-6 h-6" />
          <div>
            <p
              className={clsx(
                'text-sm',

                message.status === MessageStatus.IN_QUEUE && 'text-gray-300',

                message.status === MessageStatus.DELIVERED && 'text-gray-500',

                message.status === MessageStatus.FAILED && 'text-red-500',
              )}
            >
              {message.content}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default Message
