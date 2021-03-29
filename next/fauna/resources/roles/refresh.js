import {
  Collection,
  CreateRole,
  CurrentIdentity,
  Equals,
  Function,
  Get,
  Index,
  Lambda,
  Query,
  Select,
} from 'faunadb'
import { IsCalledWithRefreshToken } from '../../auth/tokens'

export default CreateRole({
  name: 'refresh',
  membership: [
    {
      resource: Collection('users'),
      predicate: Query(Lambda(_ref => IsCalledWithRefreshToken())),
    },
  ],
  privileges: [
    {
      resource: Collection('rate_limiting'),
      actions: {
        read: Query(ref =>
          Equals(CurrentIdentity(), Select(['data', 'identity'], Get(ref))),
        ),
        write: Query((_oldData, newData) =>
          Equals(CurrentIdentity(), Select(['data', 'identity'], newData)),
        ),
        create: Query(newData =>
          Equals(CurrentIdentity(), Select(['data', 'identity'], newData)),
        ),
      },
    },
    {
      resource: Index('rate_limiting_by_action_and_identity'),
      actions: {
        read: Query(terms => Equals(CurrentIdentity(), Select([1], terms))),
      },
    },
    {
      resource: Function('refresh'),
      actions: {
        call: true,
      },
    },
    {
      resource: Function('logout'),
      actions: {
        call: true,
      },
    },
  ],
})
