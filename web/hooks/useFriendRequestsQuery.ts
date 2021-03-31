import { FriendRequestsPayload } from '@/api/friendRequests'
import { HttpError, json } from '@/util/json'
import { useQuery } from 'react-query'

export function useFriendRequestsQuery() {
  return useQuery<FriendRequestsPayload, HttpError>('friendRequests', () =>
    json<FriendRequestsPayload>('/api/friendRequests'),
  )
}
