import { query as q } from 'faunadb'
import { useRouter } from 'next/router'
import { useMutation, useQueryClient } from 'react-query'
import { useFaunaClient } from './useFaunaClient'
import { useFaunaStore } from './useFaunaStore'

export interface DirectMessageMutation {
  directMessageId: string
  channelId: string
  isNewChannel: boolean
}

interface DirectMessageVariables {
  friendId: string
}

export const directMessage = (variables: DirectMessageVariables) =>
  q.Let(
    {
      friendRef: q.Ref(q.Collection('users'), variables.friendId),
      existingChannel: q.Union(
        q.Match(q.Index('channels_by_subscriber1_and_subscriber2'), [
          q.CurrentIdentity(),
          q.Var('friendRef'),
        ]),
        q.Match(q.Index('channels_by_subscriber1_and_subscriber2'), [
          q.Var('friendRef'),
          q.CurrentIdentity(),
        ]),
      ),
    },
    q.If(
      q.Exists(q.Var('existingChannel')),
      q.Let(
        {
          channel: q.Get(q.Var('existingChannel')),
          directMessage: q.Get(
            q.Match(
              q.Index('dms_by_channel'),
              q.Select(['ref'], q.Var('channel')),
            ),
          ),
        },
        {
          directMessageId: q.Select(['ref', 'id'], q.Var('directMessage')),
          channelId: q.Select(['ref', 'id'], q.Var('channel')),
          isNewChannel: false,
        },
      ),
      q.Let(
        {
          channel: q.Create(q.Collection('channels'), {
            data: {
              subscriber1: q.CurrentIdentity(),
              subscriber2: q.Var('friendRef'),
            },
          }),
          directMessage: q.Create(q.Collection('dms'), {
            data: {
              user1Ref: q.CurrentIdentity(),
              user2Ref: q.Var('friendRef'),
              channel: q.Select(['ref'], q.Var('channel')),
            },
          }),
        },
        {
          directMessageId: q.Select(['ref', 'id'], q.Var('directMessage')),
          channelId: q.Select(['ref', 'id'], q.Var('channel')),
          isNewChannel: true,
        },
      ),
    ),
  )

export function useDirectMessageMutation() {
  const client = useFaunaClient()
  const accessToken = useFaunaStore(state => state.accessToken)
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation<DirectMessageMutation, unknown, DirectMessageVariables>(
    variables => {
      return client.query(directMessage(variables), { secret: accessToken })
    },
    {
      onSuccess: data => {
        if (data.isNewChannel) {
          queryClient.invalidateQueries('dms')
        }

        router.push(`/app/dms/${data.directMessageId}/${data.channelId}`)
      },
    },
  )
}
