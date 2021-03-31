import { CancelFriendRequestVariables } from '@/api/friendRequests/[id]/cancel'
import { HttpError, json } from '@/util/json'
import { useMutation, useQueryClient } from 'react-query'

export function useCancelFriendRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation<unknown, HttpError, CancelFriendRequestVariables>(
    variables =>
      json(`/api/friendRequests/${variables.id}/cancel`, { method: 'POST' }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('friendRequests')
      },
    },
  )
}
