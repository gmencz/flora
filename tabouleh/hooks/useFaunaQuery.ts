import { Expr } from 'faunadb'
import { useQuery, UseQueryOptions, UseQueryResult } from 'react-query'
import { useFaunaClient } from './useFaunaClient'
import { useFaunaStore } from './useFaunaStore'

interface UseFaunaQueryOptions<TQueryFnData, TError, TData>
  extends Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryFn'> {
  fql: Expr
}

function useFaunaQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData
>(
  options: UseFaunaQueryOptions<TQueryFnData, TError, TData>,
): UseQueryResult<TData, TError> {
  const client = useFaunaClient()
  const accessToken = useFaunaStore(state => state.accessToken)

  const query = useQuery<TQueryFnData, TError, TData>({
    ...options,
    queryFn: async () => {
      const faunaResult = await client.query(options.fql, {
        secret: accessToken,
      })

      return (faunaResult as unknown) as TQueryFnData
    },
  })

  return query
}

export default useFaunaQuery
