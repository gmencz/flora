import { Expr, query as q } from 'faunadb'
import { useMutation, useQueryClient } from 'react-query'
import {
  DirectMessage,
  DirectMessageStatus,
  DirectMessageDetails,
} from '@/hooks/useDirectMessageQuery'
import { useFaunaClient } from './useFaunaClient'
import { nanoid } from 'nanoid'
import { useFaunaStore } from './useFaunaStore'

interface SendDirectMessageVariables
  extends Pick<DirectMessage, 'content' | 'nonce'> {
  channel: string
  dm: string
}

export function useSendDirectMessageMutation() {
  const client = useFaunaClient()
  const accessToken = useFaunaStore(state => state.accessToken)
  const queryClient = useQueryClient()

  return useMutation<unknown, unknown, SendDirectMessageVariables>(
    async variables => {
      return client.query<string | unknown>(
        q.Let(
          {
            lastMessageSentAt: q.Select(
              ['data', 'lastMessageSentAt'],
              q.Get(q.CurrentIdentity()),
              (null as unknown) as Expr,
            ),
            rateLimitTimestamp: q.Now(),
          },
          q.If(
            q.IsNull(q.Var('lastMessageSentAt')),

            q.Do(
              q.Let(
                {
                  newMessage: q.Create(q.Collection('messages'), {
                    data: {
                      content: variables.content,
                      nonce: variables.nonce,
                      channelRef: q.Ref(
                        q.Collection('channels'),
                        variables.channel,
                      ),
                      userRef: q.CurrentIdentity(),
                      timestamp: q.Now(),
                    },
                  }),
                  newMessageData: {
                    timestamp: q.ToString(
                      q.Select(['data', 'timestamp'], q.Var('newMessage')),
                    ),
                    nonce: q.Select(['data', 'nonce'], q.Var('newMessage')),
                    content: q.Select(['data', 'content'], q.Var('newMessage')),
                    status: DirectMessageStatus.DELIVERED,
                    user: q.Let(
                      {
                        userDoc: q.Get(
                          q.Select(['data', 'userRef'], q.Var('newMessage')),
                        ),
                      },
                      {
                        id: q.Select(['ref', 'id'], q.Var('userDoc')),
                        name: q.Select(['data', 'name'], q.Var('userDoc')),
                        photo: q.Select(['data', 'photoURL'], q.Var('userDoc')),
                      },
                    ),
                  },
                },
                q.Update(q.Ref(q.Collection('channels'), variables.channel), {
                  data: {
                    latestMessage: q.Var('newMessageData'),
                  },
                }),
              ),

              q.Update(q.CurrentIdentity(), {
                data: {
                  lastMessageSentAt: q.Var('rateLimitTimestamp'),
                },
              }),

              {
                rateLimitTimestamp: q.ToString(q.Var('rateLimitTimestamp')),
              },
            ),

            q.If(
              q.LT(
                q.TimeDiff(q.Var('lastMessageSentAt'), q.Now(), 'milliseconds'),
                1000,
              ),

              q.Abort("You can't send more than 1 message every second"),

              q.Do(
                q.Let(
                  {
                    newMessage: q.Create(q.Collection('messages'), {
                      data: {
                        content: variables.content,
                        nonce: variables.nonce,
                        channelRef: q.Ref(
                          q.Collection('channels'),
                          variables.channel,
                        ),
                        userRef: q.CurrentIdentity(),
                        timestamp: q.Now(),
                      },
                    }),
                    newMessageData: {
                      timestamp: q.ToString(
                        q.Select(['data', 'timestamp'], q.Var('newMessage')),
                      ),
                      nonce: q.Select(['data', 'nonce'], q.Var('newMessage')),
                      content: q.Select(
                        ['data', 'content'],
                        q.Var('newMessage'),
                      ),
                      status: DirectMessageStatus.DELIVERED,
                      user: q.Let(
                        {
                          userDoc: q.Get(
                            q.Select(['data', 'userRef'], q.Var('newMessage')),
                          ),
                        },
                        {
                          id: q.Select(['ref', 'id'], q.Var('userDoc')),
                          name: q.Select(['data', 'name'], q.Var('userDoc')),
                          photo: q.Select(
                            ['data', 'photoURL'],
                            q.Var('userDoc'),
                          ),
                        },
                      ),
                    },
                  },
                  q.Update(q.Ref(q.Collection('channels'), variables.channel), {
                    data: {
                      latestMessage: q.Var('newMessageData'),
                    },
                  }),
                ),

                q.Update(q.CurrentIdentity(), {
                  data: {
                    lastMessageSentAt: q.Var('rateLimitTimestamp'),
                  },
                }),

                {
                  rateLimitTimestamp: q.ToString(q.Var('rateLimitTimestamp')),
                },
              ),
            ),
          ),
        ),
        {
          secret: accessToken,
        },
      )
    },
    {
      onError: (_error, variables) => {
        queryClient.setQueryData<DirectMessageDetails>(
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
