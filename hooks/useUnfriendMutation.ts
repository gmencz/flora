import { useMutation, useQueryClient } from 'react-query'
import { useFaunaClient } from './useFaunaClient'
import { query as q } from 'faunadb'
import { useFaunaStore } from './useFaunaStore'

interface UnfriendVariables {
  friendId: string
}

export function useUnfriendMutation() {
  const queryClient = useQueryClient()
  const client = useFaunaClient()
  const accessToken = useFaunaStore(state => state.accessToken)

  return useMutation<unknown, unknown, UnfriendVariables>(
    variables => {
      return client.query(
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
