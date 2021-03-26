import { AddRateLimiting } from '@/fauna/auth/rateLimiting'
import { query as q } from 'faunadb'
import { useMutation, useQueryClient } from 'react-query'
import { useFauna } from './useFauna'

interface RejectFriendRequestVariables {
  friendRequestId: string
}

export function useRejectFriendRequestMutation() {
  const queryClient = useQueryClient()
  const { client, accessToken } = useFauna()

  return useMutation<unknown, unknown, RejectFriendRequestVariables>(
    variables => {
      return client.query(
        AddRateLimiting(
          q.Delete(
            q.Ref(
              q.Collection('user_friend_requests'),
              variables.friendRequestId,
            ),
          ),
        ),
        { secret: accessToken },
      )
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pendingFriendRequests')
      },
    },
  )
}
