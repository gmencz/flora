import { Client as FaunaClient, ClientConfig } from 'faunadb'
import {
  createContext,
  MutableRefObject,
  ReactNode,
  useCallback,
  useMemo,
} from 'react'

const baseConfig: Omit<ClientConfig, 'secret'> =
  process.env.NODE_ENV === 'production'
    ? {}
    : {
        scheme: 'http',
        domain: '127.0.0.1',
        port: 8443,
      }

export function createClient(secret: string) {
  const client = new FaunaClient({
    ...baseConfig,
    secret,
  })

  return client
}

interface IFaunaClientContext {
  client: FaunaClient
  silentRefreshRef: MutableRefObject<NodeJS.Timeout | undefined>
  accessTokenRef: MutableRefObject<string | undefined>
  getAccessToken: () => string
}

export const FaunaClientContext = createContext<IFaunaClientContext | null>(
  null,
)

interface FaunaClientProviderProps {
  children: ReactNode
  client: FaunaClient
  silentRefreshRef: MutableRefObject<NodeJS.Timeout | undefined>
  accessTokenRef: MutableRefObject<string | undefined>
}

export function FaunaClientProvider({
  children,
  client,
  silentRefreshRef,
  accessTokenRef,
}: FaunaClientProviderProps) {
  const getAccessToken = useCallback(() => accessTokenRef.current!, [
    accessTokenRef,
  ])

  const memoized = useMemo<IFaunaClientContext>(
    () => ({ client, silentRefreshRef, accessTokenRef, getAccessToken }),
    [client, silentRefreshRef, accessTokenRef, getAccessToken],
  )

  return (
    <FaunaClientContext.Provider value={memoized}>
      {children}
    </FaunaClientContext.Provider>
  )
}
