import { useQuery } from 'react-query'
import { HttpError, json } from '@/util/json'
import {
  DirectMessagePayload,
  DirectMessageVariables,
} from '@/api/directMessages/channels/[channel]/[dm]'

export function useDirectMessageQuery(
  variables: DirectMessageVariables & { channel: string },
) {
  return useQuery<DirectMessagePayload, HttpError>(['dm', variables.dm], () =>
    json<DirectMessagePayload>(
      `/api/directMessages/channels/${variables.channel}/${variables.dm}`,
    ),
  )
}
