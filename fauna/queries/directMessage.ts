import { DirectMessageStatus } from '@/lib/types/messages'
import resolvePagination from '@/util/resolvePagination'
import {
  Collection,
  CurrentIdentity,
  Equals,
  Get,
  If,
  Index,
  Lambda,
  Let,
  Map,
  Match,
  Paginate,
  Ref,
  Reverse,
  Select,
  ToString,
  Var,
} from 'faunadb'

const getDirectMessageFql = (dm: string, channel: string) =>
  Let(
    {
      dmDoc: Get(Ref(Collection('dms'), dm)),
      user1: Select(['data', 'user1Ref'], Var('dmDoc')),
      user2: Select(['data', 'user2Ref'], Var('dmDoc')),
      currentUserDoc: Get(CurrentIdentity()),
      withUserDoc: If(
        Equals(Var('user1'), CurrentIdentity()),
        Get(Var('user2')),
        Get(Var('user1')),
      ),
    },
    {
      currentUser: {
        id: Select(['ref', 'id'], Var('currentUserDoc')),
        name: Select(['data', 'name'], Var('currentUserDoc')),
        photo: Select(['data', 'photoURL'], Var('currentUserDoc')),
      },
      withUser: {
        id: Select(['ref', 'id'], Var('withUserDoc')),
        name: Select(['data', 'name'], Var('withUserDoc')),
        photo: Select(['data', 'photoURL'], Var('withUserDoc')),
      },
      messages: Let(
        {
          paginationResult: Reverse(
            Map(
              Paginate(
                Match(
                  Index('messages_by_channel'),
                  Ref(Collection('channels'), channel),
                ),
                {
                  size: 100, // Get the latest 100 messages from the channel
                },
              ),
              Lambda('message', {
                timestamp: ToString(Select([0], Var('message'))),
                nonce: Select([1], Var('message')),
                content: Select([2], Var('message')),
                status: DirectMessageStatus.DELIVERED,
                user: Let(
                  {
                    userDoc: Get(Select([3], Var('message'))),
                  },
                  {
                    id: Select(['ref', 'id'], Var('userDoc')),
                    name: Select(['data', 'name'], Var('userDoc')),
                    photo: Select(['data', 'photoURL'], Var('userDoc')),
                  },
                ),
              }),
            ),
          ),
        },
        resolvePagination(Var('paginationResult')),
      ),
    },
  )

export default getDirectMessageFql
