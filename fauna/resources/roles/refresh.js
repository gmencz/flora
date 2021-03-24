import { Collection, CreateRole, Function, Lambda, Query } from 'faunadb'
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
