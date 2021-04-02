import { useQuery } from 'react-query'
import { User } from '@/fauna/auth/login'
import { json } from '@/util/json'

export function useMeQuery() {
  return useQuery('me', () => json<User>('/api/auth/me'))
}
