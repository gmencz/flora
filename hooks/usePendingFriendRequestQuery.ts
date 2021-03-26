import { query as q } from 'faunadb'
import { Page } from '@/lib/types/common'
import useFaunaQuery from './useFaunaQuery'
import resolvePagination from '@/util/resolvePagination'

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

interface PendingFriendRequestsQuery {
  received: Page<ReceivedFriendRequest>
  totalReceived: number
  sent: Page<SentFriendRequest>
  totalSent: number
}

export function usePendingFriendRequestQuery() {
  return useFaunaQuery<PendingFriendRequestsQuery>({
    queryKey: 'pendingFriendRequests',
    fql: q.Let(
      {
        receivedMatch: q.Match(
          q.Index('friend_requests_by_friend'),
          q.CurrentIdentity(),
        ),
        receivedPaginationResult: q.Map(
          q.Paginate(q.Var('receivedMatch')),
          q.Lambda(
            'friendRequestRef',
            q.Let(
              {
                friendRequest: q.Get(q.Var('friendRequestRef')),
                fromUser: q.Get(
                  q.Select(['data', 'userRef'], q.Var('friendRequest')),
                ),
              },
              {
                id: q.Select(['ref', 'id'], q.Var('friendRequest')),
                fromUser: {
                  id: q.Select(['ref', 'id'], q.Var('fromUser')),
                  name: q.Select(['data', 'name'], q.Var('fromUser')),
                  photo: q.Select(['data', 'photoURL'], q.Var('fromUser')),
                },
                receivedAt: q.ToString(
                  q.Select(['data', 'sentAt'], q.Var('friendRequest')),
                ),
              },
            ),
          ),
        ),
        sentMatch: q.Match(
          q.Index('friend_requests_by_user'),
          q.CurrentIdentity(),
        ),
        sentPaginationResult: q.Map(
          q.Paginate(q.Var('sentMatch')),
          q.Lambda(
            'friendRequestRef',
            q.Let(
              {
                friendRequest: q.Get(q.Var('friendRequestRef')),
                toUser: q.Get(
                  q.Select(['data', 'friendRef'], q.Var('friendRequest')),
                ),
              },
              {
                id: q.Select(['ref', 'id'], q.Var('friendRequest')),
                toUser: {
                  id: q.Select(['ref', 'id'], q.Var('toUser')),
                  name: q.Select(['data', 'name'], q.Var('toUser')),
                  photo: q.Select(['data', 'photoURL'], q.Var('toUser')),
                },
                sentAt: q.ToString(
                  q.Select(['data', 'sentAt'], q.Var('friendRequest')),
                ),
              },
            ),
          ),
        ),
      },
      {
        received: resolvePagination(q.Var('receivedPaginationResult')),
        totalReceived: q.Count(q.Var('receivedMatch')),
        sent: resolvePagination(q.Var('sentPaginationResult')),
        totalSent: q.Count(q.Var('sentMatch')),
      },
    ),
  })
}
