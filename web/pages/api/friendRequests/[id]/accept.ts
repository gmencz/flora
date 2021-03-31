import { DirectMessageFriendPayload } from '@/api/friends/[id]/directMessage'
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
  Delete,
  Do,
  Equals,
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

export interface AcceptFriendRequestVariables {
  id: string
}

export default handler<DirectMessageFriendPayload>()
  .use(authorize)
  .post(async (req, res) => {
    try {
      const variables = req.query as Params<AcceptFriendRequestVariables>
      const { faunaToken } = getSession(req)
      const fauna = createFaunaClient(faunaToken)

      try {
        const data = await fauna.query<DirectMessageFriendPayload>(
          Let(
            {
              friendRequestRef: Ref(
                Collection('user_friend_requests'),
                variables.id,
              ),
              friendRequestDoc: Get(Var('friendRequestRef')),
              userRef: Select(['data', 'userRef'], Var('friendRequestDoc')),
              friendRef: Select(['data', 'friendRef'], Var('friendRequestDoc')),
              userToAddRef: If(
                Equals(CurrentIdentity(), Var('userRef')),
                Var('friendRef'),
                Var('userRef'),
              ),
            },
            Do(
              Delete(Var('friendRequestRef')),

              Let(
                {
                  friend: Create(Collection('user_friends'), {
                    data: {
                      user1Ref: CurrentIdentity(),
                      user2Ref: Var('userToAddRef'),
                      friendedAt: Now(),
                    },
                  }),
                  friendId: Select(['data', 'user2Ref', 'id'], Var('friend')),
                },

                Let(
                  {
                    friendRef: Ref(Collection('users'), Var('friendId')),
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
                        directMessageId: Select(
                          ['ref', 'id'],
                          Var('directMessage'),
                        ),
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
                        directMessageId: Select(
                          ['ref', 'id'],
                          Var('directMessage'),
                        ),
                        channelId: Select(['ref', 'id'], Var('channel')),
                      },
                    ),
                  ),
                ),
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
