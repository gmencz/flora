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
  const oneHour = 3600

  return useQuery<NtsToken>(
    'ntsToken',
    () => json<NtsToken>('/api/twilio/ntsToken'),
    {
      // 30 minutes
      staleTime: (oneHour - oneHour / 2) * 1000,
    },
  )
}
