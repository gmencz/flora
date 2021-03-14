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
  Select,
  Union,
  Var,
} from 'faunadb'

/*
  These are the steps this transaction has to follow:
  1. Check if the user we're trying to add exists by email.
  2. Check if the user we're trying to add is the current user (you can't add yourself).
  3. Check if the user we're trying to add already has a pending friend request.
  4. Check if the user we're trying to add is already the current user's friend.
  5. Check if the user we're trying to add also sent the current user a friend request, 
  if they did, we will add them as a friend instead of sending the friend request.
*/

const addFriendMutation = (email: string) =>
  // 1
  Let(
    {
      friend: Match(Index('users_by_email'), email),
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

          `You can't send a friend request to yourself.`,

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

              `You already sent a friend request to this user.`,

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

                  `This user is already your friend.`,

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
                            email,
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
                            email,
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

      `We looked everywhere but we couldn't find anyone with that email.`,
    ),
  )

export default addFriendMutation
