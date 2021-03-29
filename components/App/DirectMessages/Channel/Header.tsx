import { ChannelComponentProps } from '.'
import { useEffect, useRef, useState } from 'react'
import { useDirectMessageQuery } from '@/hooks/useDirectMessageQuery'
import { useNtsTokenQuery } from '@/hooks/useNtsTokenQuery'
import { useWebSocket } from '@/hooks/useWebSocket'
import { handleGetUserMediaError } from '@/util/handleGetUserMediaError'
import 'twin.macro'

function ChannelHeader({ channel, dm }: ChannelComponentProps) {
  const directMessageQuery = useDirectMessageQuery({ channel, dm })

  // Retrieve a NTS token from Twilio for the RTC configuration
  // (STUN and TURN servers).
  const ntsTokenQuery = useNtsTokenQuery()
  const ws = useWebSocket(directMessageQuery.data?.currentUser.id)
  const peerConnectionRef = useRef<RTCPeerConnection>()
  const offerRef = useRef<RTCSessionDescriptionInit>()
  const localStreamRef = useRef<MediaStream>()
  const receivedAudioRef = useRef<HTMLAudioElement>(null)
  const localAudioRef = useRef<HTMLAudioElement>(null)
  const [isBeingCalled, setIsBeingCalled] = useState(false)

  useEffect(() => {
    if (!ws) {
      return
    }

    ws.onmessage = async message => {
      const {
        ok,
        code,
        offer: rtcOffer,
        answer: rtcAnswer,
        candidate,
      } = JSON.parse(message.data)
      if (!ok) {
        if (code === 'user_offline') {
          alert(`${directMessageQuery.data?.withUser.name} is offline`)
        } else {
          alert(
            `Something went wrong calling ${directMessageQuery.data?.withUser.name}`,
          )
        }

        return
      }

      if (rtcOffer) {
        console.log(`${directMessageQuery.data?.withUser.name} is calling you!`)
        offerRef.current = rtcOffer
        setIsBeingCalled(true)
      } else if (rtcAnswer) {
        console.log(
          `${directMessageQuery.data?.withUser.name} accepted the voice call!`,
        )

        const answer = new RTCSessionDescription(rtcAnswer)
        await peerConnectionRef.current?.setRemoteDescription(answer)
      } else if (candidate) {
        const iceCandidate = new RTCIceCandidate(candidate)
        peerConnectionRef.current?.addIceCandidate(iceCandidate)
      }
    }
  }, [directMessageQuery.data?.withUser.name, ws])

  const registerPeerConnectionListeners = () => {
    peerConnectionRef.current?.addEventListener('icecandidate', event => {
      if (!event.candidate) {
        return
      }

      ws?.send(
        JSON.stringify({
          type: 'new_ice_candidate',
          targetId: directMessageQuery.data?.withUser.id,
          candidate: event.candidate.toJSON(),
        }),
      )
    })

    peerConnectionRef.current?.addEventListener('track', event => {
      console.log(event)

      receivedAudioRef.current!.srcObject = event.streams[0]
    })

    peerConnectionRef.current?.addEventListener(
      'negotiationneeded',
      async () => {
        offerRef.current = await peerConnectionRef.current?.createOffer()
        await peerConnectionRef.current?.setLocalDescription(offerRef.current!)

        const callWithOffer = {
          type: 'call_with_offer',
          callerId: directMessageQuery.data?.currentUser.id,
          calleeId: directMessageQuery.data?.withUser.id,
          offer: {
            type: offerRef.current!.type,
            sdp: offerRef.current!.sdp,
          },
        }

        // Post the offer to our dedicated signaling server.
        ws?.send(JSON.stringify(callWithOffer))
      },
    )
  }

  const startVoiceCall = async () => {
    if (peerConnectionRef.current) {
      alert("You can't start a call because you already have one open!")
    }

    // TODO: Don't allow users to start the voice call until
    // the NTS token query and the direct message query are successful.
    const { iceServers } = ntsTokenQuery.data!

    // Create the configuration with the NTS token
    const configuration: RTCConfiguration = {
      iceServers,
    }

    // Establish an RTC peer connection with the configuration and
    // create an offer
    peerConnectionRef.current = new RTCPeerConnection(configuration)
    registerPeerConnectionListeners()

    try {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      localAudioRef.current!.srcObject = localStreamRef.current

      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!)
      })
    } catch (error) {
      handleGetUserMediaError(error, () => {
        peerConnectionRef.current?.close()
      })
    }
  }

  const acceptIncomingVoiceCall = async () => {
    // TODO: Don't allow users to start the voice call until
    // the NTS token query and the direct message query are successful.
    const { iceServers } = ntsTokenQuery.data!

    // Create the configuration with the NTS token
    const configuration: RTCConfiguration = {
      iceServers,
    }

    // Establish an RTC peer connection with the configuration and
    // Create an answer for the received offer
    peerConnectionRef.current = new RTCPeerConnection(configuration)
    registerPeerConnectionListeners()

    await peerConnectionRef.current.setRemoteDescription(offerRef.current!)

    try {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!)
      })
    } catch (error) {
      handleGetUserMediaError(error, () => {
        peerConnectionRef.current?.close()
      })
    }

    const answer = await peerConnectionRef.current.createAnswer()
    await peerConnectionRef.current.setLocalDescription(answer)

    const callWithAnswer = {
      type: 'call_with_answer',
      callerId: directMessageQuery.data?.withUser.id,
      calleeId: directMessageQuery.data?.currentUser.id,
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    }

    // Post the answer to our dedicated signaling server.
    ws?.send(JSON.stringify(callWithAnswer))
  }

  return (
    <header tw="p-4 sticky top-0 px-6 bg-gray-100 shadow-sm">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={receivedAudioRef} autoPlay></audio>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={localAudioRef} autoPlay muted></audio>

      <div tw="flex">
        <div tw="flex space-x-2.5 items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            tw="h-6 w-6 text-gray-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
            />
          </svg>
          <span tw="text-sm font-bold text-gray-900">
            {directMessageQuery.data?.withUser.name}
          </span>
        </div>

        <div tw="flex ml-auto items-center space-x-4">
          {isBeingCalled && (
            <button onClick={acceptIncomingVoiceCall}>
              <svg x="0" y="0" viewBox="0 0 24 24" tw="h-6 w-6 text-green-500">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11 5V3C16.515 3 21 7.486 21 13H19C19 8.589 15.411 5 11 5ZM17 13H15C15 10.795 13.206 9 11 9V7C14.309 7 17 9.691 17 13ZM11 11V13H13C13 11.896 12.105 11 11 11ZM14 16H18C18.553 16 19 16.447 19 17V21C19 21.553 18.553 22 18 22H13C6.925 22 2 17.075 2 11V6C2 5.447 2.448 5 3 5H7C7.553 5 8 5.447 8 6V10C8 10.553 7.553 11 7 11H6C6.063 14.938 9 18 13 18V17C13 16.447 13.447 16 14 16Z"
                ></path>
              </svg>

              <span tw="sr-only">Accept Incoming Voice Call</span>
            </button>
          )}

          <button onClick={startVoiceCall}>
            <svg x="0" y="0" viewBox="0 0 24 24" tw="h-6 w-6 text-gray-500">
              <path
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11 5V3C16.515 3 21 7.486 21 13H19C19 8.589 15.411 5 11 5ZM17 13H15C15 10.795 13.206 9 11 9V7C14.309 7 17 9.691 17 13ZM11 11V13H13C13 11.896 12.105 11 11 11ZM14 16H18C18.553 16 19 16.447 19 17V21C19 21.553 18.553 22 18 22H13C6.925 22 2 17.075 2 11V6C2 5.447 2.448 5 3 5H7C7.553 5 8 5.447 8 6V10C8 10.553 7.553 11 7 11H6C6.063 14.938 9 18 13 18V17C13 16.447 13.447 16 14 16Z"
              ></path>
            </svg>

            <span tw="sr-only">Start Voice Call</span>
          </button>

          <button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              tw="h-6 w-6 text-gray-500"
            >
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>

            <span tw="sr-only">Start Video Call</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default ChannelHeader
