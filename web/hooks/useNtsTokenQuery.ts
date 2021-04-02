import { json } from '@/util/json'
import { useQuery } from 'react-query'

interface IceServer {
  urls: string | string[]
  username: string
  credential: string
}

interface NtsToken {
  iceServers: IceServer[]
}

export function useNtsTokenQuery() {
  return useQuery<NtsToken>(
    'ntsToken',
    () => json<NtsToken>('/api/twilio/ntsToken'),
    {
      staleTime: 40000 * 1000,
    },
  )
}
