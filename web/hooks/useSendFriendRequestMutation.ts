import {
  SendFriendRequestPayload,
  SendFriendRequestVariables,
} from '@/api/friendRequests'
import { HttpError, json } from '@/util/json'
import { useMutation, UseMutationOptions } from 'react-query'

export function useSendFriendRequestMutation(
  options: UseMutationOptions<
    SendFriendRequestPayload,
    HttpError,
    SendFriendRequestVariables
  >,
) {
  return useMutation<
    SendFriendRequestPayload,
    HttpError,
    SendFriendRequestVariables
  >(
    variables =>
      json<SendFriendRequestPayload, SendFriendRequestVariables>(
        '/api/friendRequests',
        { method: 'POST', body: variables },
      ),
    options,
  )
}
