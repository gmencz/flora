import { useQuery } from 'react-query'
import { json } from '@/util/json'
import { DirectMessagesPayload } from '@/api/directMessages'

export function useDirectMessagesQuery() {
  return useQuery<DirectMessagesPayload>('dms', () =>
    json<DirectMessagesPayload>('/api/directMessages'),
  )
}
