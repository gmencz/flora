import { Client as FaunaClient, ClientConfig } from 'faunadb'
import {
  createContext,
  MutableRefObject,
  ReactNode,
  useContext,
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
}

const FaunaClientContext = createContext<IFaunaClientContext | null>(null)

export interface FaunaAccess {
  secret: string
  interval: NodeJS.Timeout
}

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
  const memoized = useMemo<IFaunaClientContext>(
    () => ({ client, silentRefreshRef, accessTokenRef }),
    [client, silentRefreshRef, accessTokenRef],
  )

  return (
    <FaunaClientContext.Provider value={memoized}>
      {children}
    </FaunaClientContext.Provider>
  )
}

export function useFauna() {
  const context = useContext(FaunaClientContext)

  if (!context) {
    throw new Error(`Can't use hook 'useFauna' outside of a FaunaProvider`)
  }

  return context
}
