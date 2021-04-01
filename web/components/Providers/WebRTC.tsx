import {
  createContext,
  MutableRefObject,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react'

interface IWebRTCContext {
  peerConnection: MutableRefObject<RTCPeerConnection | undefined>
  offer: MutableRefObject<RTCSessionDescriptionInit | undefined>
  otherPeerUid: MutableRefObject<string>
  localStream: MutableRefObject<MediaStream | undefined>
  remoteStream: MutableRefObject<MediaStream | undefined>
  cleanup: VoidFunction
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

  const cleanup = useCallback(() => {
    localStream.current?.getTracks().forEach(track => {
      track.stop()
    })

    remoteStream.current?.getTracks().forEach(track => {
      track.stop()
    })

    localStream.current = undefined
    remoteStream.current = undefined
    offer.current = undefined
    peerConnection.current = undefined
    otherPeerUid.current = ''
  }, [localStream, offer, otherPeerUid, peerConnection])

  const value = useMemo<IWebRTCContext>(
    () => ({
      peerConnection,
      offer,
      otherPeerUid,
      localStream,
      remoteStream,
      cleanup,
    }),
    [cleanup],
  )

  return (
    <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>
  )
}
