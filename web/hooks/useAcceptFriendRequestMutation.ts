import { DirectMessageFriendPayload } from '@/api/friends/[id]/directMessage'
import { AcceptFriendRequestVariables } from '@/api/friendRequests/[id]/accept'
import { HttpError, json } from '@/util/json'
import { useRouter } from 'next/router'
import { useMutation, useQueryClient } from 'react-query'

export function useAcceptFriendRequestMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation<
    DirectMessageFriendPayload,
    HttpError,
    AcceptFriendRequestVariables
  >(
    variables =>
      json(`/api/friendRequests/${variables.id}/accept`, { method: 'POST' }),
    {
      onSuccess: data => {
        queryClient.invalidateQueries('friendRequests')
        queryClient.invalidateQueries('dms').then(() => {
          router.push(`/app/dms/${data.directMessageId}/${data.channelId}`)
        })
      },
    },
  )
}
