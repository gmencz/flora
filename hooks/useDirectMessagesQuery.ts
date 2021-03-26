import { Page } from '@/lib/types'
import useFaunaQuery from './useFaunaQuery'
import { query as q } from 'faunadb'
import resolvePagination from '@/util/resolvePagination'

interface DirectMessageUser {
  id: string
  name: string
  photo: string
}

interface DirectMessage {
  id: string
  channelId: string
  withUser: DirectMessageUser
}

export function useDirectMessagesQuery() {
  return useFaunaQuery<Page<DirectMessage>>({
    queryKey: 'dms',
    fql: q.Let(
      {
        paginationResult: q.Map(
          q.Paginate(
            q.Union(
              q.Match(q.Index('dms_by_user1'), q.CurrentIdentity()),
              q.Match(q.Index('dms_by_user2'), q.CurrentIdentity()),
            ),
          ),
          q.Lambda(
            'ref',
            q.Let(
              {
                dmDoc: q.Get(q.Var('ref')),
                user1: q.Select(['data', 'user1Ref'], q.Var('dmDoc')),
                user2: q.Select(['data', 'user2Ref'], q.Var('dmDoc')),
                withUser: q.If(
                  q.Equals(q.Var('user1'), q.CurrentIdentity()),
                  q.Get(q.Var('user2')),
                  q.Get(q.Var('user1')),
                ),
              },
              {
                id: q.Select(['ref', 'id'], q.Var('dmDoc')),
                channelId: q.Select(
                  ['ref', 'id'],
                  q.Get(q.Select(['data', 'channel'], q.Var('dmDoc'))),
                ),
                withUser: {
                  id: q.Select(['ref', 'id'], q.Var('withUser')),
                  name: q.Select(['data', 'name'], q.Var('withUser')),
                  photo: q.Select(['data', 'photoURL'], q.Var('withUser')),
                },
              },
            ),
          ),
        ),
      },
      resolvePagination(q.Var('paginationResult')),
    ),
    staleTime: Infinity,
  })
}
