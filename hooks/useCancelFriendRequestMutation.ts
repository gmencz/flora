import { AddRateLimiting } from '@/fauna/auth/rateLimiting'
import { query as q } from 'faunadb'
import { useMutation, useQueryClient } from 'react-query'
import { useFauna } from './useFauna'

interface CancelFriendRequestVariables {
  friendRequestId: string
}

export function useCancelFriendRequestMutation() {
  const { client, accessToken } = useFauna()
  const queryClient = useQueryClient()

  return useMutation<unknown, unknown, CancelFriendRequestVariables>(
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
