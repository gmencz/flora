import { MaybeError } from '@/lib/types'
import { VoiceCallAnswer, VoiceCallOffer } from '@chatskee/gateway'
import { useCallback, useEffect } from 'react'
import shallow from 'zustand/shallow'
import { useGatewayWs } from './useGatewayWs'
import { useNotificationSoundStore } from './useNotificationSoundStore'
import { useNtsTokenQuery } from './useNtsTokenQuery'
import { useOneToOneCallStore } from './useOneToOneCallStore'
import { useUserStore } from './useUserStore'
import { useWebRTC } from './useWebRTC'

interface UseOneToOneCallOptions {
  onCalleeOffline: VoidFunction
  onUnexpectedError: VoidFunction
  onGetUserMediaError: (error: Error) => void
  onLocalStreamReady: (localStream: MediaStream) => void
  onRemoteStreamReady: (localStream: MediaStream) => void
  dm: string
}

interface UseOneToOneCall {
  startCall: (otherPeerUid: string) => Promise<void>
  acceptIncomingCall: () => Promise<void>
  localStream: MediaStream | undefined
  remoteStream: MediaStream | undefined
  isConnectedWithPeer: (peerUid: string) => boolean
  isCurrentPeerConnected: boolean
  otherPeerUid: string
  endCall: VoidFunction
}

export function useOneToOneCall(
  options: UseOneToOneCallOptions,
): UseOneToOneCall {
  const {
    peerConnection,
    offer,
    otherPeerUid,
    localStream,
    remoteStream,
    cleanup,
  } = useWebRTC()

  const {
    isCurrentPeerConnected,
    setIsCurrentPeerConnected,
    isOtherPeerConnected,
    setIsOtherPeerConnected,
  } = useOneToOneCallStore(
    state => ({
      setConnectionStatus: state.setConnectionStatus,
      isCurrentPeerConnected: state.isCurrentPeerConnected,
      setIsCurrentPeerConnected: state.setIsCurrentPeerConnected,
      isOtherPeerConnected: state.isOtherPeerConnected,
      setIsOtherPeerConnected: state.setIsOtherPeerConnected,
    }),
    shallow,
  )

  const play = useNotificationSoundStore(state => state.play)
  const currentUser = useUserStore(state => state.user)
  const ntsTokenQuery = useNtsTokenQuery()
  const ws = useGatewayWs()

  const _endCall = useCallback(() => {
    cleanup()
    setIsCurrentPeerConnected(false)
    setIsOtherPeerConnected(false)
    play('/sounds/ended-call.mp3')
  }, [cleanup, play, setIsCurrentPeerConnected, setIsOtherPeerConnected])

  useEffect(() => {
    const unsubs = [
      ws.addListener<MaybeError<VoiceCallOffer>>('voice_call_offer', event => {
        if (event.err) {
          if (event.err === 'user_offline') {
            options.onCalleeOffline()
          } else {
            options.onUnexpectedError()
          }
          return
        }

        offer.current = event.offer
        otherPeerUid.current = event.callerId
        setIsOtherPeerConnected(true)
      }),

      ws.addListener<MaybeError<VoiceCallAnswer>>(
        'voice_call_answer',
        async event => {
          if (event.err) {
            options.onUnexpectedError()
            return
          }

          const answer = new RTCSessionDescription(event.answer)
          try {
            await peerConnection.current?.setRemoteDescription(answer)
          } catch (error) {
            options.onUnexpectedError()
          }

          otherPeerUid.current = event.calleeId
          setIsOtherPeerConnected(true)
        },
      ),

      ws.addListener<MaybeError<RTCIceCandidateInit>>(
        'new_ice_candidate',
        candidate => {
          if (candidate.err) {
            return
          }

          const iceCandidate = new RTCIceCandidate(candidate)
          peerConnection.current?.addIceCandidate(iceCandidate)
        },
      ),
    ]

    return () => {
      unsubs.forEach(unsub => unsub())
    }
  }, [
    _endCall,
    cleanup,
    currentUser,
    offer,
    options,
    otherPeerUid,
    peerConnection,
    setIsCurrentPeerConnected,
    setIsOtherPeerConnected,
    ws,
  ])

  const registerPeerConnectionListeners = useCallback(() => {
    peerConnection.current?.addEventListener('icecandidate', event => {
      if (!event.candidate) {
        return
      }

      ws.send('new_ice_candidate', {
        targetId: otherPeerUid.current,
        candidate: event.candidate.toJSON(),
      })
    })

    peerConnection.current?.addEventListener('track', event => {
      remoteStream.current = event.streams[0]
      options?.onRemoteStreamReady?.(remoteStream.current)
    })

    peerConnection.current?.addEventListener('negotiationneeded', async () => {
      offer.current = await peerConnection.current?.createOffer()
      await peerConnection.current?.setLocalDescription(offer.current!)

      ws.send('voice_call_offer', {
        callerId: currentUser?.firebaseUid,
        calleeId: otherPeerUid.current,
        dm: options.dm,
        offer: {
          type: offer.current!.type,
          sdp: offer.current!.sdp,
        },
      })
    })
  }, [
    currentUser?.firebaseUid,
    offer,
    options,
    otherPeerUid,
    peerConnection,
    remoteStream,
    ws,
  ])

  const startCall = useCallback<UseOneToOneCall['startCall']>(
    async uid => {
      const { iceServers } = ntsTokenQuery.data!

      // Create the configuration with the NTS token
      const configuration: RTCConfiguration = {
        iceServers,
      }

      // Establish an RTC peer connection with the configuration and
      // create an offer
      peerConnection.current = new RTCPeerConnection(configuration)
      registerPeerConnectionListeners()

      try {
        localStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })

        otherPeerUid.current = uid
        options?.onLocalStreamReady?.(localStream.current)

        localStream.current.getTracks().forEach(track => {
          peerConnection.current?.addTrack(track, localStream.current!)
        })

        setIsCurrentPeerConnected(true)
      } catch (error) {
        cleanup()
        options?.onGetUserMediaError?.(error)
      }
    },
    [
      cleanup,
      localStream,
      ntsTokenQuery.data,
      options,
      otherPeerUid,
      peerConnection,
      registerPeerConnectionListeners,
      setIsCurrentPeerConnected,
    ],
  )

  const acceptIncomingCall = useCallback<
    UseOneToOneCall['acceptIncomingCall']
  >(async () => {
    const { iceServers } = ntsTokenQuery.data!

    const configuration: RTCConfiguration = {
      iceServers,
    }

    // Establish an RTC peer connection with the configuration and
    // Create an answer for the received offer
    peerConnection.current = new RTCPeerConnection(configuration)
    registerPeerConnectionListeners()

    await peerConnection.current.setRemoteDescription(offer.current!)

    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      options?.onLocalStreamReady?.(localStream.current)

      localStream.current.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, localStream.current!)
      })
    } catch (error) {
      cleanup()
      return options?.onGetUserMediaError?.(error)
    }

    const answer = await peerConnection.current.createAnswer()
    await peerConnection.current.setLocalDescription(answer)

    ws.send('voice_call_answer', {
      callerId: otherPeerUid.current,
      calleeId: currentUser?.firebaseUid,
      dm: options.dm,
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    })

    setIsCurrentPeerConnected(true)
    setIsOtherPeerConnected(true)
  }, [
    cleanup,
    currentUser?.firebaseUid,
    localStream,
    ntsTokenQuery.data,
    offer,
    options,
    otherPeerUid,
    peerConnection,
    registerPeerConnectionListeners,
    setIsCurrentPeerConnected,
    setIsOtherPeerConnected,
    ws,
  ])

  const endCall = useCallback(() => {
    ws.send('voice_call_ended', {
      otherPeerId: otherPeerUid.current,
    })

    _endCall()
  }, [_endCall, otherPeerUid, ws])

  const isConnectedWithPeer = useCallback<
    UseOneToOneCall['isConnectedWithPeer']
  >(peerUid => isOtherPeerConnected && peerUid === otherPeerUid.current, [
    isOtherPeerConnected,
    otherPeerUid,
  ])

  return {
    startCall,
    acceptIncomingCall,
    isConnectedWithPeer,
    isCurrentPeerConnected,
    localStream: localStream.current,
    remoteStream: remoteStream.current,
    otherPeerUid: otherPeerUid.current,
    endCall,
  }
}
