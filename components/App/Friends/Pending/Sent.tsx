import Tooltip from '@/components/ui/Tooltip'
import { SentFriendRequest as ISentFriendRequest } from '@/fauna/queries/pendingFriendRequests'
import { useFauna } from '@/lib/useFauna'
import formatMessageTimestamp from '@/util/formatMessageTimestamp'
import { Collection, Delete, Ref } from 'faunadb'
import { useMutation, useQueryClient } from 'react-query'
import 'twin.macro'

interface SentFriendRequestProps {
  friendRequest: ISentFriendRequest
}

interface CancelFriendRequestVariables {
  friendRequestId: string
}

function SentFriendRequest({ friendRequest }: SentFriendRequestProps) {
  const { client, getAccessToken } = useFauna()
  const queryClient = useQueryClient()
  const cancelFriendRequest = useMutation<
    unknown,
    unknown,
    CancelFriendRequestVariables
  >(
    variables => {
      return client.query(
        Delete(
          Ref(Collection('user_friend_requests'), variables.friendRequestId),
        ),
        { secret: getAccessToken() },
      )
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pendingFriendRequests')
      },
    },
  )

  const onClickCancel = () => {
    cancelFriendRequest.mutate({ friendRequestId: friendRequest.id })
  }

  return (
    <div tw="py-4 flex items-center space-x-4">
      <img
        src={friendRequest.toUser.photo}
        alt={friendRequest.toUser.name}
        tw="h-9 w-9 rounded-full"
      />

      <div tw="flex flex-1 items-center">
        <div tw="flex flex-col mr-6">
          <span tw="text-sm font-semibold text-gray-900">
            {friendRequest.toUser.name}
          </span>
          <time
            dateTime={friendRequest.sentAt}
            tw="text-xs font-medium text-gray-700"
          >
            {formatMessageTimestamp(friendRequest.sentAt)}
          </time>
        </div>

        <div tw="ml-auto flex items-center">
          <div className="group" tw="relative rounded-full">
            <Tooltip label="Cancel" position="left">
              <button
                onClick={onClickCancel}
                tw="rounded-full bg-gray-200 group-hover:bg-gray-300 p-1.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  tw="h-5 w-5 text-gray-700 group-hover:text-red-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span tw="sr-only">Cancel</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SentFriendRequest
