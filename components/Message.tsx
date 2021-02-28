import clsx from 'clsx'
import Image from 'next/image'
import { IMessage, MessageStatus } from '../pages/index'
import formatMessageTimestamp from '../utils/formatMessageTimestamp'

interface MessageProps {
  message: IMessage
}

function Message({ message }: MessageProps) {
  return (
    <div className="flex space-x-3 break-all">
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

        <div className="flex items-center justify-between space-x-2">
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
      </div>
    </div>
  )
}

export default Message
