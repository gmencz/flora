import { useQuery } from 'react-query'
import { FriendsPayload } from '@/api/friends'
import { HttpError, json } from '@/util/json'

export function useFriendsQuery() {
  return useQuery<FriendsPayload, HttpError>('friends', () =>
    json<FriendsPayload>('/api/friends'),
  )
}
