import { DirectMessageStatus, NewMessage } from '@/lib/types/messages'
import {
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

const sendDirectMessageFql = (newMessage: NewMessage, channel: string) =>
  Let(
    {
      lastMessageSentAt: Select(
        ['data', 'lastMessageSentAt'],
        CurrentIdentity(),
        (null as unknown) as Expr,
      ),
    },
    If(
      IsNull(Var('lastMessageSentAt')),

      Do(
        Let(
          {
            newMessage: Create(Collection('messages'), {
              data: {
                content: newMessage.content,
                nonce: newMessage.nonce,
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
                  userDoc: Get(Select(['data', 'userRef'], Var('newMessage'))),
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
        Update(Ref(Collection('users'), Select(['id'], CurrentIdentity())), {
          data: {
            lastMessageSentAt: Now(),
          },
        }),
      ),

      If(
        LT(TimeDiff(Var('lastMessageSentAt'), Now(), 'milliseconds'), 1000),

        `You can't send more than 1 message every second`,

        Do(
          Let(
            {
              newMessage: Create(Collection('messages'), {
                data: {
                  content: newMessage.content,
                  nonce: newMessage.nonce,
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
          Update(Ref(Collection('users'), Select(['id'], CurrentIdentity())), {
            data: {
              lastMessageSentAt: Now(),
            },
          }),
        ),
      ),
    ),
  )

export default sendDirectMessageFql
