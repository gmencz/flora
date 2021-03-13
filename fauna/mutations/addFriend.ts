import {
  Collection,
  Create,
  CurrentIdentity,
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
  Var,
} from 'faunadb'

const addFriendMutation = (email: string) =>
  Let(
    {
      friend: Match(Index('users_by_email'), email),
    },
    If(
      Exists(Var('friend')),
      Let(
        {
          friendRef: Select(['ref'], Get(Var('friend'))),
        },
        If(
          Equals(CurrentIdentity(), Var('friendRef')),

          `You can't send a friend request to yourself`,

          Let(
            {
              friendRef: Select(['ref'], Get(Var('friend'))),
              existingFriendRequest: Match(
                Index('friend_requests_by_friend'),
                Var('friendRef'),
              ),
            },
            If(
              Exists(Var('existingFriendRequest')),

              `You already sent a friend request to this user.`,

              Let(
                {
                  existingFriend: Match(Index('friends_by_user_and_friend'), [
                    CurrentIdentity(),
                    Var('friendRef'),
                  ]),
                },
                If(
                  Exists(Var('existingFriend')),

                  `This user is already your friend.`,

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
                      },
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
