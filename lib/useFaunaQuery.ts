import { Expr } from 'faunadb'
import { useQuery, UseQueryOptions, UseQueryResult } from 'react-query'
import { useFauna } from './useFauna'

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
  const { client, getAccessToken } = useFauna()
  const query = useQuery<TQueryFnData, TError, TData>({
    ...options,
    queryFn: async () => {
      const faunaResult = await client.query(options.fql, {
        secret: getAccessToken(),
      })

      return (faunaResult as unknown) as TQueryFnData
    },
  })

  return query
}

export default useFaunaQuery
