import { Client as FaunaClient, ExprArg, QueryOptions } from 'faunadb'
import { useCallback, useEffect, useRef } from 'react'
import createClient from './faunadb'
import { FaunaRefreshResult } from 'pages/api/fauna/refresh'
import { useSession } from './session'
import firebase from '@/lib/firebase'
import { useRouter } from 'next/router'
import { differenceInMinutes } from 'date-fns'

async function refreshAccessToken(): Promise<FaunaRefreshResult> {
  const response = await fetch('/api/fauna/refresh', {
    method: 'POST',
    credentials: 'include',
  })

  if (
    response.ok === false ||
    (response.status >= 400 && response.status < 600)
  ) {
    throw new Error('Bad response from server')
  }

  const data = await response.json()
  return data
}

const auth = firebase.auth()

export default function useFauna() {
  const { accessToken, setAccessToken } = useSession()
  const lastAccessTokenRef = useRef(accessToken?.token)
  const faunaRef = useRef<FaunaClient>()
  const router = useRouter()

  const refreshToken = useCallback(async () => {
    try {
      const result = await refreshAccessToken()
      setAccessToken({
        token: result.accessToken,
        exp: result.exp,
      })
      return result.accessToken
    } catch (error) {
      setAccessToken(null)
      auth
        .signOut()
        .then(() => {
          router.push('/login')
        })
        .catch(error => {
          console.error(error)
          router.push('/login')
        })
    }
  }, [router, setAccessToken])

  // If the initial fauna client hasn't been instantiated and we have an access token,
  // we will instantiated a new fauna client with it.
  if (accessToken && !faunaRef.current) {
    faunaRef.current = createClient(accessToken.token)
    lastAccessTokenRef.current = accessToken.token
  }

  useEffect(() => {
    // If there's no access token because it has expired or some other reason
    // we need to go refresh it.
    if (!accessToken) {
      refreshToken()
    }
  }, [accessToken, refreshToken])

  useEffect(() => {
    // If the access token has changed (due to a token refresh), we will
    // instantiate a new fauna client.
    if (accessToken && accessToken.token !== lastAccessTokenRef.current) {
      faunaRef.current = createClient(accessToken.token)
      lastAccessTokenRef.current = accessToken.token
    }
  }, [accessToken])

  if (!accessToken) {
    return null
  }

  return {
    query: async <T = object>(
      expr: ExprArg,
      options?: QueryOptions,
    ): Promise<T> => {
      const minutes = differenceInMinutes(new Date(accessToken.exp), new Date())

      if (minutes <= 1) {
        const refreshedToken = await refreshToken()
        faunaRef.current = createClient(refreshedToken)
      }

      return faunaRef.current!.query(expr, options)
    },
  }
}
