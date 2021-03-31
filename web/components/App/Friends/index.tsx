import withAuthenticationRequired from '@/components/Auth/withAuthenticationRequired'
import { parseISO } from 'date-fns'
import { formatDistanceToNow } from 'date-fns'
import DirectMessagesSidebar from '../DirectMessages/Sidebar'
import FriendsHeader from './Header'
import { Tooltip } from '@/components/ui/Tooltip'
import { Menu, MenuButton, MenuItem, MenuList } from '@reach/menu-button'
import '@reach/menu-button/styles.css'
import tw, { styled } from 'twin.macro'
import { useFriendsQuery } from '@/hooks/useFriendsQuery'
import { useDirectMessageMutation } from '@/hooks/useDirectMessageMutation'
import { useUnfriendMutation } from '@/hooks/useUnfriendMutation'

const FriendOptions = styled(MenuList)`
  ${tw`border-0 rounded-md shadow-lg bg-white ring-opacity-5 space-y-1.5 py-2 px-0 text-sm font-semibold text-gray-800`}

  > [data-reach-menu-item][data-selected] {
    ${tw`bg-gray-100 text-gray-900`}
  }
`

function Friends() {
  const friendsQuery = useFriendsQuery()

  const directMessageMutation = useDirectMessageMutation()
  const unfriendMutation = useUnfriendMutation()

  const onMessage = (friendId: string) => {
    directMessageMutation.mutate({ id: friendId })
  }

  const onUnfriend = (friendId: string) => {
    unfriendMutation.mutate({ id: friendId })
  }

  return (
    <div tw="flex">
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

                    <div tw="flex flex-1 items-center">
                      <div tw="flex flex-col mr-6">
                        <span tw="text-sm font-semibold text-gray-900">
                          {friend.name}
                        </span>
                        <span tw="text-xs font-medium text-gray-700">
                          Friends for{' '}
                          {formatDistanceToNow(parseISO(friend.friendedAt))}
                        </span>
                      </div>

                      <div tw="ml-auto flex items-center space-x-4">
                        <div className="group" tw="relative rounded-full">
                          <Tooltip label="Message" position="left">
                            <button
                              onClick={() => onMessage(friend.id)}
                              tw="rounded-full bg-gray-200 group-hover:bg-gray-300 p-1.5"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                tw="h-5 w-5 text-gray-700 group-hover:text-gray-900"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span tw="sr-only">Message</span>
                            </button>
                          </Tooltip>
                        </div>

                        <Menu>
                          <MenuButton
                            className="group"
                            tw="relative rounded-full"
                          >
                            <div tw="rounded-full bg-gray-200 group-hover:bg-gray-300 p-1.5">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                tw="h-5 w-5 text-gray-700 group-hover:text-gray-900"
                              >
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>

                              <span tw="sr-only">Options</span>
                            </div>
                          </MenuButton>

                          {/* @ts-ignore */}
                          <FriendOptions>
                            <MenuItem
                              onSelect={() => onUnfriend(friend.id)}
                              tw="flex space-x-3"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                tw="h-5 w-5"
                              >
                                <path d="M11 6a3 3 0 11-6 0 3 3 0 016 0zM14 17a6 6 0 00-12 0h12zM13 8a1 1 0 100 2h4a1 1 0 100-2h-4z" />
                              </svg>

                              <span>Unfriend</span>
                            </MenuItem>
                          </FriendOptions>
                        </Menu>
                      </div>
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
