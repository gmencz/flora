import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react'

interface ISessionContext {
  accessToken: AccessToken | null
  setAccessToken: Dispatch<SetStateAction<AccessToken | null>>
}

const SessionContext = createContext<ISessionContext | null>(null)

interface SessionProviderProps {
  children: ReactNode
}

interface AccessToken {
  token: string
  exp: string
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [accessToken, setAccessToken] = useState<null | AccessToken>(null)

  const memoizedValue = useMemo(() => ({ accessToken, setAccessToken }), [
    accessToken,
  ])

  return (
    <SessionContext.Provider value={memoizedValue}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error(`Can't use hook 'useSession' outside of a SessionProvider`)
  }

  return context
}
