import { Client as FaunaClient } from 'faunadb'
import { createContext, ReactNode, useMemo } from 'react'

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
