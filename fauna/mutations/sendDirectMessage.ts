import { DirectMessageStatus, NewMessage } from '@/lib/types/messages'
import {
  Collection,
  Create,
  CurrentIdentity,
  Get,
  Let,
  Now,
  Ref,
  Select,
  ToString,
  Update,
  Var,
} from 'faunadb'

const sendDirectMessageFql = (newMessage: NewMessage, channel: string) =>
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
        timestamp: ToString(Select(['data', 'timestamp'], Var('newMessage'))),
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
  )

export default sendDirectMessageFql
