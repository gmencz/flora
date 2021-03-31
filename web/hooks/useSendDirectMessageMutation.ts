import { useMutation, useQueryClient } from 'react-query'
import { nanoid } from 'nanoid'
import { HttpError, json } from '@/util/json'
import {
  DirectMessageStatus,
  SendDirectMessageVariables,
} from '@/api/directMessages/channels/[channel]'
import { DirectMessagePayload } from '@/api/directMessages/channels/[channel]/[dm]'

export function useSendDirectMessageMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    any,
    HttpError,
    SendDirectMessageVariables & { channel: string }
  >(
    async variables =>
      json<any, SendDirectMessageVariables>(
        `/api/directMessages/channels/${variables.channel}`,
        {
          method: 'POST',
          body: {
            content: variables.content,
            dm: variables.dm,
            nonce: variables.nonce,
          },
        },
      ),
    {
      onError: (_error, variables) => {
        queryClient.setQueryData<DirectMessagePayload>(
          ['dm', variables.dm],
          existing => {
            const botUid = nanoid()

            return {
              ...existing!,
              messages: {
                ...existing!.messages,
                data: [
                  ...existing!.messages.data.map(message => {
                    if (message.nonce === variables.nonce) {
                      return {
                        ...message,
                        status: DirectMessageStatus.FAILED,
                      }
                    }

                    return message
                  }),
                  {
                    content:
                      "Your message could not be delivered. This is usually because the recipient isn't your friend or Chatskee is having internal issues.",
                    nonce: nanoid(),
                    status: DirectMessageStatus.INFO,
                    timestamp: new Date().toISOString(),
                    user: {
                      id: botUid,
                      uid: botUid,
                      name: 'Bonnie',
                      photo: '/bonnie.png',
                    },
                  },
                ],
              },
            }
          },
        )
      },
    },
  )
}
