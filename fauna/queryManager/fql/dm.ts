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
  Select,
  ToString,
  Var,
} from 'faunadb'

const getDmFql = (dm: string, channel: string) =>
  Let(
    {
      dmDoc: Get(Ref(Collection('dms'), dm)),
      user1: Select(['data', 'user1Ref'], Var('dmDoc')),
      user2: Select(['data', 'user2Ref'], Var('dmDoc')),
      withUserRef: If(
        Equals(Var('user1'), CurrentIdentity()),
        Get(Var('user2')),
        Get(Var('user1')),
      ),
    },
    {
      withUser: {
        id: Select(['ref', 'id'], Var('withUserRef')),
        name: Select(['data', 'name'], Var('withUserRef')),
        photo: Select(['data', 'photoURL'], Var('withUserRef')),
      },
      messages: Let(
        {
          paginationResult: Map(
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
        },
        resolvePagination(Var('paginationResult')),
      ),
    },
  )

export default getDmFql
