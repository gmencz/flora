import { Client as FaunaClient, ClientConfig } from 'faunadb'
import {
  createContext,
  Dispatch,
  MutableRefObject,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react'

const baseConfig: Omit<ClientConfig, 'secret'> =
  process.env.NODE_ENV === 'production'
    ? {}
    : {
        scheme: 'http',
        domain: '127.0.0.1',
        port: 8443,
      }

export function createClient(secret: string = process.env.FAUNADB_SERVER_KEY!) {
  const client = new FaunaClient({
    ...baseConfig,
    secret,
  })

  return client
}

interface IFaunaContext {
  accessToken: string | null
  setAccessToken: Dispatch<SetStateAction<string | null>>
  client: FaunaClient | undefined
}

const FaunaContext = createContext<IFaunaContext | null>(null)

interface FaunaProviderProps {
  children: ReactNode
  clientRef: MutableRefObject<FaunaClient | undefined>
}

export function FaunaProvider({ children, clientRef }: FaunaProviderProps) {
  const [accessToken, setAccessToken] = useState<null | string>(null)

  const memoizedValue = useMemo(
    () => ({ accessToken, setAccessToken, client: clientRef.current }),
    [accessToken, clientRef],
  )

  return (
    <FaunaContext.Provider value={memoizedValue}>
      {children}
    </FaunaContext.Provider>
  )
}

export function useFauna() {
  const context = useContext(FaunaContext)

  if (!context) {
    throw new Error(`Can't use hook 'useFauna' outside of a FaunaProvider`)
  }

  return context
}
