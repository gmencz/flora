import { CreateFunction, Lambda, Query } from 'faunadb'
import { RefreshToken } from '../../../fauna/mutations/auth'

export default CreateFunction({
  name: 'refresh',
  body: Query(Lambda([], RefreshToken())),
  role: 'server',
})
