import { CreateFunction, Lambda, Query } from 'faunadb'
import { RefreshToken } from '../../auth/refresh'

export default CreateFunction({
  name: 'refresh',
  body: Query(Lambda([], RefreshToken())),
  role: 'server',
})
