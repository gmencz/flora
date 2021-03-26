import { AddRateLimiting } from '@/fauna/auth/rateLimiting'
import { errors, query as q } from 'faunadb'
import { useMutation, UseMutationOptions } from 'react-query'
import { useFauna } from './useFauna'

export interface SendFriendRequestVariables {
  email: string
}

interface SendFriendRequestMutation extends SendFriendRequestVariables {
  added: boolean
}

/*
  These are the steps this transaction has to follow:
  1. Check if the user we're trying to add exists by email.
  2. Check if the user we're trying to add is the current user (you can't add yourself).
  3. Check if the user we're trying to add already has a pending friend request.
  4. Check if the user we're trying to add is already the current user's friend.
  5. Check if the user we're trying to add also sent the current user a friend request, 
  if they did, we will add them as a friend instead of sending the friend request.
*/

const addFriend = (variables: SendFriendRequestVariables) =>
  AddRateLimiting(
    // 1
    q.Let(
      {
        friend: q.Match(q.Index('users_by_email'), variables.email),
      },
      q.If(
        q.Exists(q.Var('friend')),
        // 2
        q.Let(
          {
            friendRef: q.Select(['ref'], q.Get(q.Var('friend'))),
          },
          q.If(
            q.Equals(q.CurrentIdentity(), q.Var('friendRef')),

            q.Abort(`You can't send a friend request to yourself.`),

            // 3
            q.Let(
              {
                friendRef: q.Select(['ref'], q.Get(q.Var('friend'))),
                existingFriendRequest: q.Match(
                  q.Index('friend_requests_by_friend_and_user'),
                  [q.Var('friendRef'), q.CurrentIdentity()],
                ),
              },
              q.If(
                q.Exists(q.Var('existingFriendRequest')),

                q.Abort(`You already sent a friend request to this user.`),

                // 4
                q.Let(
                  {
                    existingFriend: q.Union(
                      q.Match(q.Index('friends_by_user1_and_user2'), [
                        q.CurrentIdentity(),
                        q.Var('friendRef'),
                      ]),
                      q.Match(q.Index('friends_by_user1_and_user2'), [
                        q.Var('friendRef'),
                        q.CurrentIdentity(),
                      ]),
                    ),
                  },
                  q.If(
                    q.Exists(q.Var('existingFriend')),

                    q.Abort(`This user is already your friend.`),

                    // 5
                    q.Let(
                      {
                        existingFriendRequestFromFriend: q.Match(
                          q.Index('friend_requests_by_friend_and_user'),
                          [q.CurrentIdentity(), q.Var('friendRef')],
                        ),
                      },
                      q.If(
                        q.Exists(q.Var('existingFriendRequestFromFriend')),

                        q.Do(
                          q.Delete(
                            q.Select(
                              ['ref'],
                              q.Get(q.Var('existq.ingFriendRequestFromFriend')),
                            ),
                          ),
                          q.Create(q.Collection('user_friends'), {
                            data: {
                              user1Ref: q.CurrentIdentity(),
                              user2Ref: q.Var('friendRef'),
                              friendedAt: q.Now(),
                            },
                          }),
                          q.Let(
                            {},
                            {
                              email: variables.email,
                              added: true,
                            },
                          ),
                        ),

                        q.Do(
                          q.Create(q.Collection('user_friend_requests'), {
                            data: {
                              userRef: q.CurrentIdentity(),
                              friendRef: q.Var('friendRef'),
                              sentAt: q.Now(),
                            },
                          }),
                          q.Let(
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

        q.Abort(
          `We looked everywhere but we couldn't find anyone with that email.`,
        ),
      ),
    ),
  )

export function useSendFriendRequestMutation(
  options: UseMutationOptions<
    SendFriendRequestMutation,
    errors.FaunaError,
    SendFriendRequestVariables
  >,
) {
  const { client, accessToken } = useFauna()

  return useMutation<
    SendFriendRequestMutation,
    errors.FaunaError,
    SendFriendRequestVariables
  >(variables => {
    return client.query(addFriend(variables), {
      secret: accessToken,
    })
  }, options)
}
