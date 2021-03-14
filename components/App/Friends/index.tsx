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
import Tooltip from '@/components/ui/Tooltip'
import { useMutation, useQueryClient } from 'react-query'
import { useFauna } from '@/lib/useFauna'
import {
  Collection,
  Create,
  CurrentIdentity,
  Exists,
  Get,
  If,
  Index,
  Intersection,
  Let,
  Match,
  Ref,
  Select,
  Var,
} from 'faunadb'
import { useRouter } from 'next/router'

interface FriendsQuery {
  friends: Page<Friend>
  friendsCount: number
}

interface MessageVariables {
  friendId: string
}

interface MessageMutation {
  directMessageId: string
  channelId: string
  isNewChannel: boolean
}

function Friends() {
  const friendsQuery = useFaunaQuery<FriendsQuery>({
    queryKey: 'friends',
    fql: friendsFql,
  })

  const queryClient = useQueryClient()
  const router = useRouter()
  const { client, getAccessToken } = useFauna()
  const messageMutation = useMutation<
    MessageMutation,
    unknown,
    MessageVariables
  >(
    variables => {
      return client.query(
        Let(
          {
            friendRef: Ref(Collection('users'), variables.friendId),
            existingChannel: Intersection(
              Match(Index('channels_by_subscribers'), CurrentIdentity()),
              Match(Index('channels_by_subscribers'), Var('friendRef')),
            ),
          },
          If(
            Exists(Var('existingChannel')),
            Let(
              {
                channel: Get(Var('existingChannel')),
                directMessage: Get(
                  Match(
                    Index('dms_by_channel'),
                    Select(['ref'], Var('channel')),
                  ),
                ),
              },
              {
                directMessageId: Select(['ref', 'id'], Var('directMessage')),
                channelId: Select(['ref', 'id'], Var('channel')),
                isNewChannel: false,
              },
            ),
            Let(
              {
                channel: Create(Collection('channels'), {
                  data: {
                    subscribers: [CurrentIdentity(), Var('friendRef')],
                  },
                }),
                directMessage: Create(Collection('dms'), {
                  data: {
                    user1Ref: CurrentIdentity(),
                    user2Ref: Var('friendRef'),
                    channel: Select(['ref'], Var('channel')),
                  },
                }),
              },
              {
                directMessageId: Select(['ref', 'id'], Var('directMessage')),
                channelId: Select(['ref', 'id'], Var('channel')),
                isNewChannel: true,
              },
            ),
          ),
        ),

        { secret: getAccessToken() },
      )
    },
    {
      onSuccess: data => {
        if (data.isNewChannel) {
          queryClient.invalidateQueries('dms')
        }

        router.push(`/app/dms/${data.directMessageId}/${data.channelId}`)
      },
    },
  )

  const onMessage = (friendId: string) => {
    messageMutation.mutate({ friendId })
  }

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
