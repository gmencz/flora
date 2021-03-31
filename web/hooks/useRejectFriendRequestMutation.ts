import { useMutation, useQueryClient } from 'react-query'
import { RejectFriendRequestVariables } from '@/api/friendRequests/[id]/reject'
import { HttpError, json } from '@/util/json'

export function useRejectFriendRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation<any, HttpError, RejectFriendRequestVariables>(
    variables =>
      json(`/api/friendRequests/${variables.id}/reject`, { method: 'POST' }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('friendRequests')
      },
    },
  )
}
