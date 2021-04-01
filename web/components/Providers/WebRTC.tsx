import {
  createContext,
  MutableRefObject,
  ReactNode,
  useMemo,
  useRef,
} from 'react'

interface IWebRTCContext {
  peerConnection: MutableRefObject<RTCPeerConnection | undefined>
  offer: MutableRefObject<RTCSessionDescriptionInit | undefined>
  otherPeerUid: MutableRefObject<string>
  localStream: MutableRefObject<MediaStream | undefined>
  remoteStream: MutableRefObject<MediaStream | undefined>
}

export const WebRTCContext = createContext<IWebRTCContext | null>(null)

interface WebRTCProviderProps {
  children: ReactNode
}

export function WebRTCProvider({ children }: WebRTCProviderProps) {
  const peerConnection = useRef<RTCPeerConnection>()
  const offer = useRef<RTCSessionDescriptionInit>()
  const otherPeerUid = useRef<string>('')
  const localStream = useRef<MediaStream>()
  const remoteStream = useRef<MediaStream>()

  const value = useMemo<IWebRTCContext>(
    () => ({
      peerConnection,
      offer,
      otherPeerUid,
      localStream,
      remoteStream,
    }),
    [],
  )

  return (
    <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>
  )
}
