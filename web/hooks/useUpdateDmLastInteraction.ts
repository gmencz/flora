import { UpdateLastInteractionVariables } from '@/api/directMessages/[id]/lastInteraction'
import { HttpError, json } from '@/util/json'
import { useMutation, UseMutationOptions } from 'react-query'

export function useUpdateDmLastInteraction(
  options?: UseMutationOptions<any, HttpError, UpdateLastInteractionVariables>,
) {
  return useMutation<any, HttpError, UpdateLastInteractionVariables>(
    variables =>
      json(`/api/directMessages/${variables.id}/lastInteraction`, {
        method: 'PUT',
      }),
    options,
    // {
    //   onSuccess: (_, variables) => {
    //     queryClient.setQueryData<DirectMessagesPayload>('dms', existing => {
    //       const updatedDm = existing?.data.find(dm => dm.id === variables.id)

    //       if (!updatedDm) {
    //         return existing!
    //       }

    //       return {
    //         before: existing!.before,
    //         after: existing!.after,
    //         data: [
    //           updatedDm,
    //           ...existing!.data.filter(dm => dm.id !== updatedDm.id),
    //         ],
    //       }
    //     })

    //     play('/sounds/call-sound.mp3', { loop: true })
    //   },
    // },
  )
}
