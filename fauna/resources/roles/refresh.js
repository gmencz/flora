import {
  And,
  Collection,
  CreateRole,
  CurrentToken,
  Equals,
  Function,
  Get,
  HasCurrentToken,
  Lambda,
  Query,
  Select,
} from 'faunadb'

export default CreateRole({
  name: 'refresh',
  membership: [
    {
      resource: Collection('users'),
      predicate: Query(
        Lambda(
          'ref',
          And(
            HasCurrentToken(),
            Equals(
              Select(['data', 'type'], Get(CurrentToken()), false),
              'refresh',
            ),
          ),
        ),
      ),
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
