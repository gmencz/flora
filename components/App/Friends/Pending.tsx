import withAuthenticationRequired from '@/components/Auth/withAuthenticationRequired'
import DirectMesssagesSidebar from '../DirectMessages/Sidebar'
import ServersSidebar from '../Servers/Sidebar'
import FriendsHeader from './Header'
import 'twin.macro'
import useFaunaQuery from '@/lib/useFaunaQuery'
import pendingFriendRequestsQuery, {
  PendingFriendRequestsQuery,
} from '@/fauna/queries/pendingFriendRequests'
import formatMessageTimestamp from '@/util/formatMessageTimestamp'

function PendingFriendRequests() {
  const query = useFaunaQuery<PendingFriendRequestsQuery>({
    queryKey: 'pendingFriendRequests',
    fql: pendingFriendRequestsQuery,
  })

  const hasReceivedFriendRequests = (query.data?.received.data.length ?? 0) > 0
  const hasSentFriendRequests = (query.data?.sent.data.length ?? 0) > 0

  return (
    <div tw="flex">
      <ServersSidebar />

      <DirectMesssagesSidebar />

      <div tw="flex-1 flex flex-col">
        <FriendsHeader />

        <div tw="flex-1 flex flex-col p-6 space-y-8">
          {hasReceivedFriendRequests && (
            <section tw="divide-y">
              <h2 tw="uppercase pb-2 text-tiny font-semibold text-gray-900">
                Pending friend requests you received
              </h2>

              <ol tw="divide-y">
                {query.data?.received.data.map(friendRequest => (
                  <li
                    key={friendRequest.id}
                    tw="py-4 flex items-center space-x-4"
                  >
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
                  </li>
                ))}
              </ol>
            </section>
          )}

          {hasSentFriendRequests && (
            <section tw="divide-y">
              <h2 tw="uppercase pb-2 text-tiny font-semibold text-gray-900">
                Pending friend requests you sent
              </h2>

              <ol tw="divide-y">
                {query.data?.sent.data.map(friendRequest => (
                  <li
                    key={friendRequest.id}
                    tw="py-4 flex items-center space-x-4"
                  >
                    <img
                      src={friendRequest.toUser.photo}
                      alt={friendRequest.toUser.name}
                      tw="h-9 w-9 rounded-full"
                    />

                    <div tw="flex flex-col">
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
                  </li>
                ))}
              </ol>
            </section>
          )}

          {query.isSuccess &&
            !hasReceivedFriendRequests &&
            !hasSentFriendRequests && (
              <div tw="flex-1 flex flex-col items-center justify-center text-center">
                <img alt="Wumpus" tw="w-60 h-60" src="/wumpus.png" />
                <p tw="text-gray-500 font-medium">
                  There are no pending friend requests. Here's Wumpus for now.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}

export default withAuthenticationRequired(PendingFriendRequests)
