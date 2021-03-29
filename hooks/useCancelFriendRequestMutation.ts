import { query as q } from 'faunadb'
import { useMutation, useQueryClient } from 'react-query'
import { useFaunaClient } from './useFaunaClient'
import { useFaunaStore } from './useFaunaStore'

interface CancelFriendRequestVariables {
  friendRequestId: string
}

export function useCancelFriendRequestMutation() {
  const client = useFaunaClient()
  const accessToken = useFaunaStore(state => state.accessToken)
  const queryClient = useQueryClient()

  return useMutation<unknown, unknown, CancelFriendRequestVariables>(
    variables => {
      return client.query(
        q.Delete(
          q.Ref(
            q.Collection('user_friend_requests'),
            variables.friendRequestId,
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
