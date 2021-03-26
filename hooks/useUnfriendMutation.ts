import { useMutation, useQueryClient } from 'react-query'
import { useFauna } from './useFauna'
import { query as q } from 'faunadb'
import { AddRateLimiting } from '@/fauna/auth/rateLimiting'

interface UnfriendVariables {
  friendId: string
}

export function useUnfriendMutation() {
  const queryClient = useQueryClient()
  const { client, accessToken } = useFauna()

  return useMutation<unknown, unknown, UnfriendVariables>(
    variables => {
      return client.query(
        AddRateLimiting(
          q.Let(
            {
              friendRequest: q.Select(
                ['ref'],
                q.Get(
                  q.Union(
                    q.Match(q.Index('friends_by_user1_and_user2'), [
                      q.CurrentIdentity(),
                      q.Ref(q.Collection('users'), variables.friendId),
                    ]),
                    q.Match(q.Index('friends_by_user1_and_user2'), [
                      q.Ref(q.Collection('users'), variables.friendId),
                      q.CurrentIdentity(),
                    ]),
                  ),
                ),
              ),
            },
            q.Delete(q.Var('friendRequest')),
          ),
        ),
        {
          secret: accessToken,
        },
      )
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('friends')
      },
    },
  )
}
