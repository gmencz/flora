import {
  Collection,
  Create,
  CurrentIdentity,
  Delete,
  Do,
  Equals,
  Get,
  If,
  Let,
  Now,
  Ref,
  Select,
  Var,
} from 'faunadb'
import { getOrCreateDirectMessageMutation } from './getOrCreateDirectMessage'

const acceptFriendRequestMutation = (friendRequestId: string) =>
  Let(
    {
      friendRequestRef: Ref(
        Collection('user_friend_requests'),
        friendRequestId,
      ),
      friendRequestDoc: Get(Var('friendRequestRef')),
      userRef: Select(['data', 'userRef'], Var('friendRequestDoc')),
      friendRef: Select(['data', 'friendRef'], Var('friendRequestDoc')),
      userToAddRef: If(
        Equals(CurrentIdentity(), Var('userRef')),
        Var('friendRef'),
        Var('userRef'),
      ),
    },
    Do(
      Delete(Var('friendRequestRef')),

      Let(
        {
          friend: Create(Collection('user_friends'), {
            data: {
              user1Ref: CurrentIdentity(),
              user2Ref: Var('userToAddRef'),
              friendedAt: Now(),
            },
          }),
          friendId: Select(['data', 'user2Ref', 'id'], Var('friend')),
        },
        getOrCreateDirectMessageMutation(Var('friendId') as string),
      ),
    ),
  )

export default acceptFriendRequestMutation
