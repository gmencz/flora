import { ChannelComponentProps } from '.'
import { useDirectMessageQuery } from '@/hooks/useDirectMessageQuery'
import { useOneToOneCall } from '@/hooks/useOneToOneCall'
import { useRef } from 'react'
import { useNotificationSoundStore } from '@/hooks/useNotificationSoundStore'
import { DirectMessagesPayload } from '@/api/directMessages'
import { useQueryClient } from 'react-query'
import { useUpdateDmLastInteraction } from '@/hooks/useUpdateDmLastInteraction'
import 'twin.macro'

function ChannelHeader({ channel, dm }: ChannelComponentProps) {
  const directMessageQuery = useDirectMessageQuery({ channel, dm })
  const queryClient = useQueryClient()
  const localAudioElement = useRef<HTMLAudioElement>(null)
  const remoteAudioElement = useRef<HTMLAudioElement>(null)
  const play = useNotificationSoundStore(state => state.play)
  const stopCallSoundNotification = useNotificationSoundStore(
    state => state.stop,
  )

  const { mutate: updateDmLastInteraction } = useUpdateDmLastInteraction({
    onSuccess: (_, variables) => {
      queryClient.setQueryData<DirectMessagesPayload>('dms', existing => {
        const updatedDm = existing?.data.find(dm => dm.id === variables.id)

        if (!updatedDm) {
          return existing!
        }

        return {
          before: existing!.before,
          after: existing!.after,
          data: [
            updatedDm,
            ...existing!.data.filter(dm => dm.id !== updatedDm.id),
          ],
        }
      })
    },
  })

  const {
    startCall,
    acceptIncomingCall,
    endCall,
    isCurrentPeerConnected,
    isConnectedWithPeer,
    otherPeerUid,
  } = useOneToOneCall({
    dm,
    onAlreadyInCall: () => {
      console.log('Already in a call with this user')
    },
    onCalleeOffline: () => {
      console.log('Callee offline')
    },
    onGetUserMediaError: error => {
      console.log('Error getting user media: ', error)
    },
    onUnexpectedError: () => {
      console.log('Unexpected error')
    },
    onLocalStreamReady: stream => {
      if (!localAudioElement.current) {
        return
      }

      localAudioElement.current.srcObject = stream
    },
    onRemoteStreamReady: stream => {
      if (!remoteAudioElement.current) {
        return
      }

      remoteAudioElement.current.srcObject = stream
    },
  })

  const isOtherPeerConnected = isConnectedWithPeer(
    directMessageQuery.data?.withUser.uid ?? '',
  )

  if (
    (isOtherPeerConnected || isCurrentPeerConnected) &&
    otherPeerUid === directMessageQuery.data?.withUser.uid
  ) {
    return (
      <header tw="flex flex-col items-center justify-center pt-16 pb-6 sticky top-0 px-6 bg-gray-100 border-b border-gray-200">
        <div tw="flex space-x-12">
          {isCurrentPeerConnected && (
            <img
              tw="h-28 w-28 rounded-full object-cover"
              src={directMessageQuery.data?.currentUser.photo}
              alt={directMessageQuery.data?.currentUser.name}
            />
          )}

          {isOtherPeerConnected && (
            <img
              tw="h-28 w-28 rounded-full object-cover"
              src={directMessageQuery.data?.withUser.photo}
              alt={directMessageQuery.data?.withUser.name}
            />
          )}
        </div>

        <div tw="flex mt-8 space-x-4">
          {isOtherPeerConnected && !isCurrentPeerConnected && (
            <button
              tw="bg-green-500 p-2 rounded-full"
              onClick={() =>
                acceptIncomingCall().then(() => {
                  stopCallSoundNotification()
                })
              }
            >
              <svg x="0" y="0" viewBox="0 0 24 24" tw="h-6 w-6 text-white">
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

          <button tw="bg-red-500 p-2 rounded-full" onClick={endCall}>
            <svg viewBox="0 0 24 24" tw="h-6 w-6 text-white">
              <path
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M21.1169 1.11603L22.8839 2.88403L19.7679 6.00003L22.8839 9.11603L21.1169 10.884L17.9999 7.76803L14.8839 10.884L13.1169 9.11603L16.2329 6.00003L13.1169 2.88403L14.8839 1.11603L17.9999 4.23203L21.1169 1.11603ZM18 22H13C6.925 22 2 17.075 2 11V6C2 5.447 2.448 5 3 5H7C7.553 5 8 5.447 8 6V10C8 10.553 7.553 11 7 11H6C6.063 14.938 9 18 13 18V17C13 16.447 13.447 16 14 16H18C18.553 16 19 16.447 19 17V21C19 21.553 18.553 22 18 22Z"
              ></path>
            </svg>

            <span tw="sr-only">Disconnect</span>
          </button>
        </div>
      </header>
    )
  }

  return (
    <header tw="p-4 sticky top-0 px-6 bg-gray-100 border-b border-gray-200">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={remoteAudioElement} autoPlay></audio>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={localAudioElement} autoPlay muted></audio>

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
          <button
            onClick={() =>
              startCall(directMessageQuery.data!.withUser.uid).then(() => {
                play('/sounds/call-sound.mp3', { loop: true })
                updateDmLastInteraction({ id: dm })
              })
            }
          >
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
