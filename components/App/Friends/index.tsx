import withAuthenticationRequired from '@/components/Auth/withAuthenticationRequired'
import friendsFql from '@/fauna/queries/friends'
import { Page } from '@/lib/types/common'
import { Friend } from '@/lib/types/friends'
import useFaunaQuery from '@/lib/useFaunaQuery'
import { parseISO } from 'date-fns'
import { formatDistanceToNow } from 'date-fns'
import DirectMessagesSidebar from '../DirectMessages/Sidebar'
import ServersSidebar from '../Servers/Sidebar'
import FriendsHeader from './Header'
import 'twin.macro'

interface FriendsQuery {
  friends: Page<Friend>
  friendsCount: number
}

function Friends() {
  const friendsQuery = useFaunaQuery<FriendsQuery>({
    queryKey: 'friends',
    fql: friendsFql,
  })

  return (
    <div tw="flex">
      <ServersSidebar />

      <DirectMessagesSidebar />

      <div tw="flex-1 flex flex-col">
        <FriendsHeader />

        <div tw="flex-1 p-6 flex flex-col divide-y">
          {friendsQuery.isSuccess && friendsQuery.data.friendsCount > 0 && (
            <>
              <h2 tw="uppercase pb-2 text-tiny font-semibold text-gray-900">
                All friends — {friendsQuery.data.friendsCount}
              </h2>
              <ol tw="divide-y">
                {friendsQuery.data?.friends.data.map(friend => (
                  <li key={friend.id} tw="py-4 flex items-center space-x-4">
                    <img
                      src={friend.photo}
                      alt={friend.name}
                      tw="h-9 w-9 rounded-full"
                    />

                    <div tw="flex flex-col">
                      <span tw="text-sm font-semibold text-gray-900">
                        {friend.name}
                      </span>
                      <span tw="text-xs font-medium text-gray-700">
                        Friends for{' '}
                        {formatDistanceToNow(parseISO(friend.friendedAt))}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}

          {friendsQuery.isSuccess && friendsQuery.data.friendsCount === 0 && (
            <div tw="flex-1 flex flex-col items-center justify-center text-center">
              <img alt="Wumpus" tw="w-60 h-60" src="/wumpus.png" />
              <p tw="text-gray-500 font-medium">
                Wumpus has no friends. You could though!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default withAuthenticationRequired(Friends)