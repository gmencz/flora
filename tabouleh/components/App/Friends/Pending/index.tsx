import withAuthenticationRequired from '@/components/Auth/withAuthenticationRequired'
import DirectMesssagesSidebar from '../../DirectMessages/Sidebar'
import FriendsHeader from '../Header'
import ReceivedFriendRequest from './Received'
import SentFriendRequest from './Sent'
import { usePendingFriendRequestQuery } from '@/hooks/usePendingFriendRequestQuery'
import 'twin.macro'

function PendingFriendRequests() {
  const query = usePendingFriendRequestQuery()

  return (
    <div tw="flex">
      <DirectMesssagesSidebar />

      <div tw="flex-1 flex flex-col">
        <FriendsHeader />
        <div tw="flex-1 flex flex-col p-6 space-y-8">
          {query.isSuccess && query.data.totalReceived > 0 && (
            <section tw="divide-y">
              <h2 tw="uppercase pb-2 text-tiny font-semibold text-gray-900">
                Pending friend requests you received —{' '}
                {query.data.totalReceived}
              </h2>

              <ol tw="divide-y">
                {query.data.received.data.map(friendRequest => (
                  <li key={friendRequest.id}>
                    <ReceivedFriendRequest friendRequest={friendRequest} />
                  </li>
                ))}
              </ol>
            </section>
          )}

          {query.isSuccess && query.data.totalSent > 0 && (
            <section tw="divide-y">
              <h2 tw="uppercase pb-2 text-tiny font-semibold text-gray-900">
                Pending friend requests you sent — {query.data.totalSent}
              </h2>

              <ol tw="divide-y">
                {query.data.sent.data.map(friendRequest => (
                  <li key={friendRequest.id}>
                    <SentFriendRequest friendRequest={friendRequest} />
                  </li>
                ))}
              </ol>
            </section>
          )}

          {query.isSuccess &&
            query.data.totalSent === 0 &&
            query.data.totalReceived === 0 && (
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
