import {
  Collection,
  Create,
  CurrentIdentity,
  Exists,
  Get,
  If,
  Index,
  Let,
  Match,
  Ref,
  Select,
  Union,
  Var,
} from 'faunadb'

export interface MessageMutation {
  directMessageId: string
  channelId: string
  isNewChannel: boolean
}

export const getOrCreateDirectMessageMutation = (friendId: string) =>
  Let(
    {
      friendRef: Ref(Collection('users'), friendId),
      existingChannel: Union(
        Match(Index('channels_by_subscriber1_and_subscriber2'), [
          CurrentIdentity(),
          Var('friendRef'),
        ]),
        Match(Index('channels_by_subscriber1_and_subscriber2'), [
          Var('friendRef'),
          CurrentIdentity(),
        ]),
      ),
    },
    If(
      Exists(Var('existingChannel')),
      Let(
        {
          channel: Get(Var('existingChannel')),
          directMessage: Get(
            Match(Index('dms_by_channel'), Select(['ref'], Var('channel'))),
          ),
        },
        {
          directMessageId: Select(['ref', 'id'], Var('directMessage')),
          channelId: Select(['ref', 'id'], Var('channel')),
          isNewChannel: false,
        },
      ),
      Let(
        {
          channel: Create(Collection('channels'), {
            data: {
              subscriber1: CurrentIdentity(),
              subscriber2: Var('friendRef'),
            },
          }),
          directMessage: Create(Collection('dms'), {
            data: {
              user1Ref: CurrentIdentity(),
              user2Ref: Var('friendRef'),
              channel: Select(['ref'], Var('channel')),
            },
          }),
        },
        {
          directMessageId: Select(['ref', 'id'], Var('directMessage')),
          channelId: Select(['ref', 'id'], Var('channel')),
          isNewChannel: true,
        },
      ),
    ),
  )
