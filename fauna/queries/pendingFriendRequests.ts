import {
  Count,
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

export interface ReceivedFriendRequest {
  id: string
  fromUser: FriendRequestUser
  receivedAt: string
}

export interface SentFriendRequest {
  id: string
  toUser: FriendRequestUser
  sentAt: string
}

export interface PendingFriendRequestsQuery {
  received: Page<ReceivedFriendRequest>
  totalReceived: number
  sent: Page<SentFriendRequest>
  totalSent: number
}

const pendingFriendRequestsQuery = Let(
  {
    receivedMatch: Match(Index('friend_requests_by_friend'), CurrentIdentity()),
    receivedPaginationResult: Map(
      Paginate(Var('receivedMatch')),
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
    sentMatch: Match(Index('friend_requests_by_user'), CurrentIdentity()),
    sentPaginationResult: Map(
      Paginate(Var('sentMatch')),
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
    totalReceived: Count(Var('receivedMatch')),
    sent: resolvePagination(Var('sentPaginationResult')),
    totalSent: Count(Var('sentMatch')),
  },
)

export default pendingFriendRequestsQuery
