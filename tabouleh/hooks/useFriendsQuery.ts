import { query as q } from 'faunadb'
import { Page } from '@/lib/types'
import useFaunaQuery from './useFaunaQuery'
import resolvePagination from '@/util/resolvePagination'

interface Friend {
  id: string
  name: string
  photo: string
  friendedAt: string
}

interface FriendsQuery {
  friends: Page<Friend>
  friendsCount: number
}

export function useFriendsQuery() {
  return useFaunaQuery<FriendsQuery>({
    queryKey: 'friends',
    fql: q.Let(
      {
        match: q.Union(
          q.Match(q.Index('friends_by_user1'), q.CurrentIdentity()),
          q.Match(q.Index('friends_by_user2'), q.CurrentIdentity()),
        ),
        paginationResult: q.Map(
          q.Paginate(q.Var('match')),
          q.Lambda(
            'ref',
            q.Let(
              {
                doc: q.Get(q.Var('ref')),
                user1Ref: q.Select(['data', 'user1Ref'], q.Var('doc')),
                user2Ref: q.Select(['data', 'user2Ref'], q.Var('doc')),
                friendDoc: q.If(
                  q.Equals(q.CurrentIdentity(), q.Var('user1Ref')),
                  q.Get(q.Var('user2Ref')),
                  q.Get(q.Var('user1Ref')),
                ),
              },
              {
                id: q.Select(['ref', 'id'], q.Var('friendDoc')),
                name: q.Select(['data', 'name'], q.Var('friendDoc')),
                photo: q.Select(['data', 'photoURL'], q.Var('friendDoc')),
                friendedAt: q.ToString(
                  q.Select(['data', 'friendedAt'], q.Var('doc')),
                ),
              },
            ),
          ),
        ),
      },
      {
        friends: resolvePagination(q.Var('paginationResult')),
        friendsCount: q.Count(q.Var('match')),
      },
    ),
  })
}
