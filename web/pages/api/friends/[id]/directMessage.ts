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
  Collection,
  Create,
  CurrentIdentity,
  Exists,
  Get,
  If,
  Index,
  Let,
  Match,
  Now,
  Ref,
  Select,
  Union,
  Var,
} from 'faunadb'

export interface DirectMessageFriendPayload {
  directMessageId: string
  channelId: string
  isNewChannel: boolean
}

export interface DirectMessageFriendVariables {
  id: string
}

export default handler<DirectMessageFriendPayload>()
  .use(authorize)
  .post(async (req, res) => {
    try {
      const { id } = req.query as Params<DirectMessageFriendVariables>
      const { faunaToken } = getSession(req)
      const fauna = createFaunaClient(faunaToken)

      try {
        const data = await fauna.query<DirectMessageFriendPayload>(
          Let(
            {
              friendRef: Ref(Collection('users'), id),
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
                    Match(
                      Index('dms_by_channel'),
                      Select(['ref'], Var('channel')),
                    ),
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
                      lastInteraction: Now(),
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
          ),
        )

        return res.json(data)
      } catch (error) {
        return handleFaunaError(error, res)
      }
    } catch (error) {
      return handleServerError(error, res)
    }
  })
