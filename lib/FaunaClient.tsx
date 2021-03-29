import { Client as FaunaClient, ClientConfig } from 'faunadb'
import { createContext, ReactNode, useMemo } from 'react'

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
}

export const FaunaClientContext = createContext<IFaunaClientContext | null>(
  null,
)

interface FaunaClientProviderProps {
  children: ReactNode
  client: FaunaClient
}

export function FaunaClientProvider({
  children,
  client,
}: FaunaClientProviderProps) {
  const memoized = useMemo<IFaunaClientContext>(() => ({ client }), [client])

  return (
    <FaunaClientContext.Provider value={memoized}>
      {children}
    </FaunaClientContext.Provider>
  )
}
