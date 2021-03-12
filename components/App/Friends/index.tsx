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

function Friends() {
  const friendsQuery = useFaunaQuery<Page<Friend>>({
    queryKey: 'friends',
    fql: friendsFql,
    staleTime: Infinity,
  })

  return (
    <div tw="flex">
      <ServersSidebar />

      <DirectMessagesSidebar />

      <div tw="flex-1 flex flex-col">
        <FriendsHeader />

        <div tw="flex-1 p-6 divide-y">
          <h2 tw="uppercase pb-2 text-tiny font-semibold text-gray-900">
            All friends
          </h2>
          <ol tw="divide-y">
            {friendsQuery.data?.data.map(friend => (
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
        </div>
      </div>
    </div>
  )
}

export default withAuthenticationRequired(Friends)
