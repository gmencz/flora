import { MaybeError } from '@/lib/types'
import { useCallback, useEffect, useRef } from 'react'
import shallow from 'zustand/shallow'
import { useGatewayWs } from './useGatewayWs'
import { useNtsTokenQuery } from './useNtsTokenQuery'
import { useOneToOneCallStore } from './useOneToOneCallStore'
import { useUserStore } from './useUserStore'
import { useWebRTC } from './useWebRTC'

interface UseOneToOneCallOptions {
  otherPeerUid: string
  onCalleeOffline: VoidFunction
  onReceivedCall: VoidFunction
  onUnexpectedError: VoidFunction
  onAlreadyInCall: VoidFunction
  onGetUserMediaError: (error: Error) => void
  onLocalStreamReady: (localStream: MediaStream) => void
  onRemoteStreamReady: (localStream: MediaStream) => void
}

interface UseOneToOneCall {
  startCall: () => Promise<void>
  acceptIncomingCall: () => Promise<void>
  localStream: MediaStream | undefined
  remoteStream: MediaStream | undefined
  isCallEstablished: boolean
}

export function useOneToOneCall(
  options: UseOneToOneCallOptions,
): UseOneToOneCall {
  const offer = useRef<RTCSessionDescriptionInit>()
  const localStream = useRef<MediaStream>()
  const remoteStream = useRef<MediaStream>()
  const isCallEstablished = useRef(false)
  const currentUser = useUserStore(state => state.user)
  const ntsTokenQuery = useNtsTokenQuery()
  const ws = useGatewayWs()
  const { peerConnection } = useWebRTC()
  const { peers, setPeers } = useOneToOneCallStore(
    state => ({
      peers: state.peers,
      setPeers: state.setPeers,
    }),
    shallow,
  )

  const cleanup = useCallback(() => {
    localStream.current?.getTracks().forEach(track => {
      track.stop()
    })

    offer.current = undefined
    peerConnection.current = undefined
    setPeers([null, null])
  }, [peerConnection, setPeers])

  useEffect(() => {
    if (!options.otherPeerUid) {
      return
    }

    const unsubs = [
      ws.addListener<MaybeError<RTCSessionDescriptionInit>>(
        'voice_call_offer',
        offerInit => {
          if (offerInit.err) {
            cleanup()

            if (offerInit.err === 'callee_offline') {
              options.onCalleeOffline()
            }

            return
          }

          offer.current = offerInit
          setPeers([null, options.otherPeerUid])
          options.onReceivedCall()
        },
      ),

      ws.addListener<MaybeError<RTCSessionDescriptionInit>>(
        'voice_call_answer',
        answerInit => {
          if (answerInit.err) {
            cleanup()
            return
          }

          const answer = new RTCSessionDescription(answerInit)
          peerConnection.current?.setRemoteDescription(answer)
          setPeers([currentUser!.firebaseUid, options.otherPeerUid])
        },
      ),

      ws.addListener<MaybeError<RTCIceCandidateInit>>(
        'new_ice_candidate',
        candidate => {
          if (candidate.err) {
            cleanup()
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
  }, [cleanup, currentUser, options, peerConnection, setPeers, ws])

  useEffect(() => {
    if (
      !isCallEstablished.current &&
      peers[0] === currentUser?.firebaseUid &&
      options.otherPeerUid
    ) {
      isCallEstablished.current = true
    }
  }, [currentUser?.firebaseUid, options, options.otherPeerUid, peers])

  const registerPeerConnectionListeners = useCallback(() => {
    peerConnection.current?.addEventListener('icecandidate', event => {
      if (!event.candidate) {
        return
      }

      ws.send('new_ice_candidate', {
        targetId: options.otherPeerUid,
        candidate: event.candidate.toJSON(),
      })
    })

    peerConnection.current?.addEventListener('track', event => {
      remoteStream.current = event.streams[0]
      options.onRemoteStreamReady(remoteStream.current)
    })

    peerConnection.current?.addEventListener('negotiationneeded', async () => {
      offer.current = await peerConnection.current?.createOffer()
      await peerConnection.current?.setLocalDescription(offer.current!)

      ws.send('voice_call_offer', {
        callerId: currentUser?.firebaseUid,
        calleeId: options.otherPeerUid,
        offer: {
          type: offer.current!.type,
          sdp: offer.current!.sdp,
        },
      })
    })
  }, [
    currentUser?.firebaseUid,
    options.otherPeerUid,
    options.remoteElement,
    peerConnection,
    ws,
  ])

  const startCall = useCallback<UseOneToOneCall['startCall']>(async () => {
    if (
      peerConnection &&
      peers[0] === currentUser?.firebaseUid &&
      peers[1] === options.otherPeerUid
    ) {
      options.onAlreadyInCall()
    } else if (peerConnection) {
      // If there's a connection established between the current user
      // and some other peer and we're trying to start a call with a
      // different peer than the one with which we're currently on a
      // call with, we cleanup the connection to establish the new one
      // with the desired peer.
      cleanup()
    }

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

      options.onLocalStreamReady(localStream.current)

      localStream.current.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, localStream.current!)
      })
    } catch (error) {
      cleanup()
      options.onGetUserMediaError(error)
    }
  }, [
    cleanup,
    currentUser?.firebaseUid,
    ntsTokenQuery.data,
    options,
    peerConnection,
    peers,
    registerPeerConnectionListeners,
  ])

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

      options.onLocalStreamReady(localStream.current)

      localStream.current.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, localStream.current!)
      })
    } catch (error) {
      cleanup()
      return options.onGetUserMediaError(error)
    }

    const answer = await peerConnection.current.createAnswer()
    await peerConnection.current.setLocalDescription(answer)

    ws.send('voice_call_answer', {
      callerId: options.otherPeerUid,
      calleeId: currentUser?.firebaseUid,
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    })
  }, [
    cleanup,
    currentUser?.firebaseUid,
    ntsTokenQuery.data,
    options,
    peerConnection,
    registerPeerConnectionListeners,
    ws,
  ])

  return {
    startCall,
    acceptIncomingCall,
    localStream: localStream.current,
    remoteStream: remoteStream.current,
    isCallEstablished: isCallEstablished.current,
  }
}
