import { useQuery } from 'react-query'
import useUser from './useUser'

interface IceServer {
  urls: string | string[]
  username: string
  credential: string
}

interface NtsToken {
  iceServers: IceServer[]
}

export function useNtsTokenQuery() {
  const user = useUser()

  return useQuery<NtsToken>(
    'ntsToken',
    async () => {
      const idToken = await user.getIdToken()
      const ntsTokenResponse = await fetch('/api/twilio/ntsToken', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${idToken}`,
        },
      })

      const token: NtsToken = await ntsTokenResponse.json()
      return token
    },
    { staleTime: Infinity },
  )
}
