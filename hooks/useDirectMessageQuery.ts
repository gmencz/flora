import { query as q } from 'faunadb'
import { Page } from '@/lib/types'
import useFaunaQuery from './useFaunaQuery'
import resolvePagination from '@/util/resolvePagination'

interface DirectMessageUser {
  id: string
  name: string
  photo: string
}

export enum DirectMessageStatus {
  FAILED,
  IN_QUEUE,
  DELIVERED,
  INFO,
}

export interface DirectMessage {
  timestamp: string
  nonce: string
  content: string
  status: DirectMessageStatus
  user: DirectMessageUser
}

export interface DirectMessageDetails {
  currentUser: DirectMessageUser
  withUser: DirectMessageUser
  messages: Page<DirectMessage>
}

interface DirectMessageVariables {
  dm: string
  channel: string
}

export function useDirectMessageQuery(variables: DirectMessageVariables) {
  return useFaunaQuery<DirectMessageDetails>({
    queryKey: ['dm', variables.dm],
    fql: q.Let(
      {
        dmDoc: q.Get(q.Ref(q.Collection('dms'), variables.dm)),
        user1: q.Select(['data', 'user1Ref'], q.Var('dmDoc')),
        user2: q.Select(['data', 'user2Ref'], q.Var('dmDoc')),
        currentUserDoc: q.Get(q.CurrentIdentity()),
        withUserDoc: q.If(
          q.Equals(q.Var('user1'), q.CurrentIdentity()),
          q.Get(q.Var('user2')),
          q.Get(q.Var('user1')),
        ),
      },
      {
        currentUser: {
          id: q.Select(['ref', 'id'], q.Var('currentUserDoc')),
          name: q.Select(['data', 'name'], q.Var('currentUserDoc')),
          photo: q.Select(['data', 'photoURL'], q.Var('currentUserDoc')),
        },
        withUser: {
          id: q.Select(['ref', 'id'], q.Var('withUserDoc')),
          name: q.Select(['data', 'name'], q.Var('withUserDoc')),
          photo: q.Select(['data', 'photoURL'], q.Var('withUserDoc')),
        },
        messages: q.Let(
          {
            paginationResult: q.Reverse(
              q.Map(
                q.Paginate(
                  q.Match(
                    q.Index('messages_by_channel'),
                    q.Ref(q.Collection('channels'), variables.channel),
                  ),
                  {
                    size: 100, // Get the latest 100 messages from the channel
                  },
                ),
                q.Lambda('message', {
                  timestamp: q.ToString(q.Select([0], q.Var('message'))),
                  nonce: q.Select([1], q.Var('message')),
                  content: q.Select([2], q.Var('message')),
                  status: DirectMessageStatus.DELIVERED,
                  user: q.Let(
                    {
                      userDoc: q.Get(q.Select([3], q.Var('message'))),
                    },
                    {
                      id: q.Select(['ref', 'id'], q.Var('userDoc')),
                      name: q.Select(['data', 'name'], q.Var('userDoc')),
                      photo: q.Select(['data', 'photoURL'], q.Var('userDoc')),
                    },
                  ),
                }),
              ),
            ),
          },
          resolvePagination(q.Var('paginationResult')),
        ),
      },
    ),
    staleTime: Infinity,
  })
}
