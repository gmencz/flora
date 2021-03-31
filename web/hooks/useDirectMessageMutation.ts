import { useRouter } from 'next/router'
import { useMutation, useQueryClient } from 'react-query'
import {
  DirectMessageFriendPayload,
  DirectMessageFriendVariables,
} from '@/api/friends/[id]/directMessage'
import { HttpError, json } from '@/util/json'

export function useDirectMessageMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation<
    DirectMessageFriendPayload,
    HttpError,
    DirectMessageFriendVariables
  >(
    variables =>
      json<DirectMessageFriendPayload>(
        `/api/friends/${variables.id}/directMessage`,
        { method: 'POST' },
      ),
    {
      onSuccess: data => {
        if (data.isNewChannel) {
          queryClient.invalidateQueries('dms')
        }

        router.push(`/app/dms/${data.directMessageId}/${data.channelId}`)
      },
    },
  )
}
