import {
  CurrentIdentity,
  Get,
  Index,
  Lambda,
  Let,
  Map,
  Match,
  Paginate,
  Select,
  ToString,
  Var,
} from 'faunadb'
import resolvePagination from '@/util/resolvePagination'
import { Page } from '@/lib/types/common'

interface FriendRequestUser {
  id: string
  name: string
  photo: string
}

interface ReceivedFriendRequest {
  id: string
  fromUser: FriendRequestUser
  receivedAt: string
}

interface SentFriendRequest {
  id: string
  toUser: FriendRequestUser
  sentAt: string
}

export interface PendingFriendRequestsQuery {
  received: Page<ReceivedFriendRequest>
  sent: Page<SentFriendRequest>
}

const pendingFriendRequestsQuery = Let(
  {
    receivedPaginationResult: Map(
      Paginate(Match(Index('friend_requests_by_friend'), CurrentIdentity())),
      Lambda(
        'friendRequestRef',
        Let(
          {
            friendRequest: Get(Var('friendRequestRef')),
            fromUser: Get(Select(['data', 'userRef'], Var('friendRequest'))),
          },
          {
            id: Select(['ref', 'id'], Var('friendRequest')),
            fromUser: {
              id: Select(['ref', 'id'], Var('fromUser')),
              name: Select(['data', 'name'], Var('fromUser')),
              photo: Select(['data', 'photoURL'], Var('fromUser')),
            },
            receivedAt: ToString(
              Select(['data', 'sentAt'], Var('friendRequest')),
            ),
          },
        ),
      ),
    ),
    sentPaginationResult: Map(
      Paginate(Match(Index('friend_requests_by_user'), CurrentIdentity())),
      Lambda(
        'friendRequestRef',
        Let(
          {
            friendRequest: Get(Var('friendRequestRef')),
            toUser: Get(Select(['data', 'friendRef'], Var('friendRequest'))),
          },
          {
            id: Select(['ref', 'id'], Var('friendRequest')),
            toUser: {
              id: Select(['ref', 'id'], Var('toUser')),
              name: Select(['data', 'name'], Var('toUser')),
              photo: Select(['data', 'photoURL'], Var('toUser')),
            },
            sentAt: ToString(Select(['data', 'sentAt'], Var('friendRequest'))),
          },
        ),
      ),
    ),
  },
  {
    received: resolvePagination(Var('receivedPaginationResult')),
    sent: resolvePagination(Var('sentPaginationResult')),
  },
)

export default pendingFriendRequestsQuery
