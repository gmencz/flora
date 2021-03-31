import { useMutation, useQueryClient } from 'react-query'
import { HttpError, json } from '@/util/json'
import { UnfriendPayload, UnfriendVariables } from '@/api/friends/[id]'

export function useUnfriendMutation() {
  const queryClient = useQueryClient()

  return useMutation<UnfriendPayload, HttpError, UnfriendVariables>(
    variables => json(`/api/friends/${variables.id}`, { method: 'DELETE' }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('friends')
      },
    },
  )
}
