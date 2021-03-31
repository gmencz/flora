import { createFaunaClient } from '@/lib/fauna'
import {
  authorize,
  getSession,
  handleFaunaError,
  handler,
  handleServerError,
  Params,
} from '@/util/handler'
import {
  Abort,
  Collection,
  Create,
  CurrentIdentity,
  Do,
  Expr,
  Get,
  If,
  IsNull,
  Let,
  LT,
  Now,
  Ref,
  Select,
  TimeDiff,
  ToString,
  Update,
  Var,
} from 'faunadb'

export interface DirectMessageUser {
  id: string
  uid: string
  name: string
  photo: string
}

export enum DirectMessageStatus {
  FAILED,
  IN_QUEUE,
  DELIVERED,
  INFO,
}

export interface DirectMessage {
  timestamp: string
  nonce: string
  content: string
  status: DirectMessageStatus
  user: DirectMessageUser
}

export interface SendDirectMessageVariables
  extends Pick<DirectMessage, 'content' | 'nonce'> {
  dm: string
}

export default handler()
  .use(authorize)
  .post(async (req, res) => {
    try {
      const { channel } = req.query as Params<{ channel: string }>
      const variables = req.body as Params<SendDirectMessageVariables>
      const { faunaToken } = getSession(req)
      const fauna = createFaunaClient(faunaToken)

      try {
        await fauna.query(
          Let(
            {
              lastMessageSentAt: Select(
                ['data', 'lastMessageSentAt'],
                Get(CurrentIdentity()),
                (null as unknown) as Expr,
              ),
              rateLimitTimestamp: Now(),
            },
            If(
              IsNull(Var('lastMessageSentAt')),

              Do(
                Let(
                  {
                    newMessage: Create(Collection('messages'), {
                      data: {
                        content: variables.content,
                        nonce: variables.nonce,
                        channelRef: Ref(Collection('channels'), channel),
                        userRef: CurrentIdentity(),
                        timestamp: Now(),
                      },
                    }),
                    newMessageData: {
                      timestamp: ToString(
                        Select(['data', 'timestamp'], Var('newMessage')),
                      ),
                      nonce: Select(['data', 'nonce'], Var('newMessage')),
                      content: Select(['data', 'content'], Var('newMessage')),
                      status: DirectMessageStatus.DELIVERED,
                      user: Let(
                        {
                          userDoc: Get(
                            Select(['data', 'userRef'], Var('newMessage')),
                          ),
                        },
                        {
                          id: Select(['ref', 'id'], Var('userDoc')),
                          name: Select(['data', 'name'], Var('userDoc')),
                          photo: Select(['data', 'photoURL'], Var('userDoc')),
                        },
                      ),
                    },
                  },
                  Update(Ref(Collection('channels'), channel), {
                    data: {
                      latestMessage: Var('newMessageData'),
                    },
                  }),
                ),

                Update(CurrentIdentity(), {
                  data: {
                    lastMessageSentAt: Var('rateLimitTimestamp'),
                  },
                }),

                {
                  rateLimitTimestamp: ToString(Var('rateLimitTimestamp')),
                },
              ),

              If(
                LT(
                  TimeDiff(Var('lastMessageSentAt'), Now(), 'milliseconds'),
                  1000,
                ),

                Abort("You can't send more than 1 message every second"),

                Do(
                  Let(
                    {
                      newMessage: Create(Collection('messages'), {
                        data: {
                          content: variables.content,
                          nonce: variables.nonce,
                          channelRef: Ref(Collection('channels'), channel),
                          userRef: CurrentIdentity(),
                          timestamp: Now(),
                        },
                      }),
                      newMessageData: {
                        timestamp: ToString(
                          Select(['data', 'timestamp'], Var('newMessage')),
                        ),
                        nonce: Select(['data', 'nonce'], Var('newMessage')),
                        content: Select(['data', 'content'], Var('newMessage')),
                        status: DirectMessageStatus.DELIVERED,
                        user: Let(
                          {
                            userDoc: Get(
                              Select(['data', 'userRef'], Var('newMessage')),
                            ),
                          },
                          {
                            id: Select(['ref', 'id'], Var('userDoc')),
                            name: Select(['data', 'name'], Var('userDoc')),
                            photo: Select(['data', 'photoURL'], Var('userDoc')),
                          },
                        ),
                      },
                    },
                    Update(Ref(Collection('channels'), channel), {
                      data: {
                        latestMessage: Var('newMessageData'),
                      },
                    }),
                  ),

                  Update(CurrentIdentity(), {
                    data: {
                      lastMessageSentAt: Var('rateLimitTimestamp'),
                    },
                  }),

                  {
                    rateLimitTimestamp: ToString(Var('rateLimitTimestamp')),
                  },
                ),
              ),
            ),
          ),
        )

        res.json({ ok: true })
      } catch (error) {
        return handleFaunaError(error, res)
      }
    } catch (error) {
      return handleServerError(error, res)
    }
  })
