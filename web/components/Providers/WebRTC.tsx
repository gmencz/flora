import {
  createContext,
  MutableRefObject,
  ReactNode,
  useMemo,
  useRef,
} from 'react'

interface IWebRTCContext {
  peerConnection: MutableRefObject<RTCPeerConnection | undefined>
}

export const WebRTCContext = createContext<IWebRTCContext | null>(null)

interface WebRTCProviderProps {
  children: ReactNode
}

export function WebRTCProvider({ children }: WebRTCProviderProps) {
  const peerConnection = useRef<RTCPeerConnection>()

  const value = useMemo<IWebRTCContext>(
    () => ({
      peerConnection,
    }),
    [peerConnection],
  )

  return (
    <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>
  )
}
