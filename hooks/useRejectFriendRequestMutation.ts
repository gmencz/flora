import { query as q } from 'faunadb'
import { useMutation, useQueryClient } from 'react-query'
import { useFaunaClient } from './useFaunaClient'
import { useFaunaStore } from './useFaunaStore'

interface RejectFriendRequestVariables {
  friendRequestId: string
}

export function useRejectFriendRequestMutation() {
  const queryClient = useQueryClient()
  const client = useFaunaClient()
  const accessToken = useFaunaStore(state => state.accessToken)

  return useMutation<unknown, unknown, RejectFriendRequestVariables>(
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
