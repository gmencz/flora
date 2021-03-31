import { createFaunaClient } from '@/lib/fauna'
import { Page } from '@/lib/types'
import {
  authorize,
  getSession,
  handleFaunaError,
  handleServerError,
  handler,
  Params,
} from '@/util/handler'
import resolvePagination from '@/util/resolvePagination'
import {
  Abort,
  Collection,
  Count,
  Create,
  CurrentIdentity,
  Delete,
  Do,
  Equals,
  Exists,
  Get,
  If,
  Index,
  Lambda,
  Let,
  Map,
  Match,
  Now,
  Paginate,
  Select,
  ToString,
  Union,
  Var,
} from 'faunadb'

interface FriendRequestUser {
  id: string
  name: string
  photo: string
}

export interface ReceivedFriendRequest {
  id: string
  fromUser: FriendRequestUser
  receivedAt: string
}

export interface SentFriendRequest {
  id: string
  toUser: FriendRequestUser
  sentAt: string
}

export interface FriendRequestsPayload {
  received: Page<ReceivedFriendRequest>
  totalReceived: number
  sent: Page<SentFriendRequest>
  totalSent: number
}

export interface SendFriendRequestVariables {
  email: string
}

export interface SendFriendRequestPayload {
  email: string
  added: boolean
}

export default handler<SendFriendRequestPayload | FriendRequestsPayload>()
  .use(authorize)
  .get(async (req, res) => {
    try {
      const { faunaToken } = getSession(req)
      const fauna = createFaunaClient(faunaToken)

      try {
        const data = await fauna.query<FriendRequestsPayload>(
          Let(
            {
              receivedMatch: Match(
                Index('friend_requests_by_friend'),
                CurrentIdentity(),
              ),
              receivedPaginationResult: Map(
                Paginate(Var('receivedMatch')),
                Lambda(
                  'friendRequestRef',
                  Let(
                    {
                      friendRequest: Get(Var('friendRequestRef')),
                      fromUser: Get(
                        Select(['data', 'userRef'], Var('friendRequest')),
                      ),
                    },
                    {
                      id: Select(['ref', 'id'], Var('friendRequest')),
                      fromUser: {
                        id: Select(['ref', 'id'], Var('fromUser')),
                        name: Select(['data', 'name'], Var('fromUser')),
                        photo: Select(['data', 'photoURL'], Var('fromUser')),
                      },
                      receivedAt: ToString(
                        Select(['data', 'sentAt'], Var('friendRequest')),
                      ),
                    },
                  ),
                ),
              ),
              sentMatch: Match(
                Index('friend_requests_by_user'),
                CurrentIdentity(),
              ),
              sentPaginationResult: Map(
                Paginate(Var('sentMatch')),
                Lambda(
                  'friendRequestRef',
                  Let(
                    {
                      friendRequest: Get(Var('friendRequestRef')),
                      toUser: Get(
                        Select(['data', 'friendRef'], Var('friendRequest')),
                      ),
                    },
                    {
                      id: Select(['ref', 'id'], Var('friendRequest')),
                      toUser: {
                        id: Select(['ref', 'id'], Var('toUser')),
                        name: Select(['data', 'name'], Var('toUser')),
                        photo: Select(['data', 'photoURL'], Var('toUser')),
                      },
                      sentAt: ToString(
                        Select(['data', 'sentAt'], Var('friendRequest')),
                      ),
                    },
                  ),
                ),
              ),
            },
            {
              received: resolvePagination(Var('receivedPaginationResult')),
              totalReceived: Count(Var('receivedMatch')),
              sent: resolvePagination(Var('sentPaginationResult')),
              totalSent: Count(Var('sentMatch')),
            },
          ),
        )

        return res.json(data)
      } catch (error) {
        handleFaunaError(error, res)
      }
    } catch (error) {
      handleServerError(error, res)
    }
  })
  .post(async (req, res) => {
    /*
      These are the steps this transaction has to follow:
      1. Check if the user we're trying to add exists by email.
      2. Check if the user we're trying to add is the current user (you can't add yourself).
      3. Check if the user we're trying to add already has a pending friend request.
      4. Check if the user we're trying to add is already the current user's friend.
      5. Check if the user we're trying to add also sent the current user a friend request, 
      if they did, we will add them as a friend instead of sending the friend request.
    */

    try {
      const variables = req.body as Params<SendFriendRequestVariables>
      const { faunaToken } = getSession(req)
      const fauna = createFaunaClient(faunaToken)

      try {
        const { email, added } = await fauna.query<SendFriendRequestPayload>(
          // 1
          Let(
            {
              friend: Match(Index('users_by_email'), variables.email),
            },
            If(
              Exists(Var('friend')),
              // 2
              Let(
                {
                  friendRef: Select(['ref'], Get(Var('friend'))),
                },
                If(
                  Equals(CurrentIdentity(), Var('friendRef')),

                  Abort(`You can't send a friend request to yourself.`),

                  // 3
                  Let(
                    {
                      friendRef: Select(['ref'], Get(Var('friend'))),
                      existingFriendRequest: Match(
                        Index('friend_requests_by_friend_and_user'),
                        [Var('friendRef'), CurrentIdentity()],
                      ),
                    },
                    If(
                      Exists(Var('existingFriendRequest')),

                      Abort(`You already sent a friend request to this user.`),

                      // 4
                      Let(
                        {
                          existingFriend: Union(
                            Match(Index('friends_by_user1_and_user2'), [
                              CurrentIdentity(),
                              Var('friendRef'),
                            ]),
                            Match(Index('friends_by_user1_and_user2'), [
                              Var('friendRef'),
                              CurrentIdentity(),
                            ]),
                          ),
                        },
                        If(
                          Exists(Var('existingFriend')),

                          Abort(`This user is already your friend.`),

                          // 5
                          Let(
                            {
                              existingFriendRequestFromFriend: Match(
                                Index('friend_requests_by_friend_and_user'),
                                [CurrentIdentity(), Var('friendRef')],
                              ),
                            },
                            If(
                              Exists(Var('existingFriendRequestFromFriend')),

                              Do(
                                Delete(
                                  Select(
                                    ['ref'],
                                    Get(Var('existingFriendRequestFromFriend')),
                                  ),
                                ),
                                Create(Collection('user_friends'), {
                                  data: {
                                    user1Ref: CurrentIdentity(),
                                    user2Ref: Var('friendRef'),
                                    friendedAt: Now(),
                                  },
                                }),
                                Let(
                                  {},
                                  {
                                    email: variables.email,
                                    added: true,
                                  },
                                ),
                              ),

                              Do(
                                Create(Collection('user_friend_requests'), {
                                  data: {
                                    userRef: CurrentIdentity(),
                                    friendRef: Var('friendRef'),
                                    sentAt: Now(),
                                  },
                                }),
                                Let(
                                  {},
                                  {
                                    email: variables.email,
                                    added: false,
                                  },
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              Abort(
                `We looked everywhere but couldn't find anyone with that email.`,
              ),
            ),
          ),
        )

        return res.json({ added, email })
      } catch (error) {
        return handleFaunaError(error, res)
      }
    } catch (error) {
      return handleServerError(error, res)
    }
  })
