import { Client as FaunaClient, ClientConfig } from 'faunadb'
import {
  createContext,
  Dispatch,
  MutableRefObject,
  ReactNode,
  SetStateAction,
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
  accessToken: string
  setAccessToken: Dispatch<SetStateAction<string>>
}

export const FaunaClientContext = createContext<IFaunaClientContext | null>(
  null,
)

interface FaunaClientProviderProps {
  children: ReactNode
  client: FaunaClient
  silentRefreshRef: MutableRefObject<NodeJS.Timeout | undefined>
  accessToken: string
  setAccessToken: Dispatch<SetStateAction<string>>
}

export function FaunaClientProvider({
  children,
  client,
  silentRefreshRef,
  accessToken,
  setAccessToken,
}: FaunaClientProviderProps) {
  const memoized = useMemo<IFaunaClientContext>(
    () => ({ client, silentRefreshRef, accessToken, setAccessToken }),
    [client, silentRefreshRef, accessToken, setAccessToken],
  )

  return (
    <FaunaClientContext.Provider value={memoized}>
      {children}
    </FaunaClientContext.Provider>
  )
}
