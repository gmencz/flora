import {
  Collection,
  CurrentIdentity,
  Equals,
  Get,
  If,
  Let,
  Ref,
  Select,
  Var,
} from 'faunadb'

const getDmFql = (dm: string) =>
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
    },
  )

export default getDmFql
