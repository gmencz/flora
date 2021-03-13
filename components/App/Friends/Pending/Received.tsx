import { ReceivedFriendRequest as IReceivedFriendRequest } from '@/fauna/queries/pendingFriendRequests'
import formatMessageTimestamp from '@/util/formatMessageTimestamp'
import 'twin.macro'

interface ReceivedFriendRequestProps {
  friendRequest: IReceivedFriendRequest
}

function ReceivedFriendRequest({ friendRequest }: ReceivedFriendRequestProps) {
  return (
    <div tw="py-4 flex items-center space-x-4">
      <img
        src={friendRequest.fromUser.photo}
        alt={friendRequest.fromUser.name}
        tw="h-9 w-9 rounded-full"
      />

      <div tw="flex flex-col">
        <span tw="text-sm font-semibold text-gray-900">
          {friendRequest.fromUser.name}
        </span>
        <time
          dateTime={friendRequest.receivedAt}
          tw="text-xs font-medium text-gray-700"
        >
          {formatMessageTimestamp(friendRequest.receivedAt)}
        </time>
      </div>
    </div>
  )
}

export default ReceivedFriendRequest
