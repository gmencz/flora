import { useEffect, useRef } from 'react'
import { QueryFunction, QueryKey, UseQueryOptions, useQuery } from 'react-query'
import {
  OperationOptions,
  SubscriptionClient,
} from 'subscriptions-transport-ws'

interface UseSubscriptionOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TSubscriptionData = unknown,
  TData = TQueryFnData
> extends UseQueryOptions<TQueryFnData, TError, TData> {
  wsUrl: string
  subscription: OperationOptions
  onData: (data: TSubscriptionData) => void
}

export default function useSubscription<
  TQueryFnData = unknown,
  TError = unknown,
  TSubscriptionData = unknown,
  TData = TQueryFnData
>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TQueryFnData>,
  options: UseSubscriptionOptions<
    TQueryFnData,
    TError,
    TSubscriptionData,
    TData
  >,
) {
  const query = useQuery(queryKey, queryFn, options)
  const subscriptionClientRef = useRef<SubscriptionClient>()

  useEffect(() => {
    if (options.enabled !== false && !subscriptionClientRef.current) {
      subscriptionClientRef.current = new SubscriptionClient(options.wsUrl, {
        reconnect: true,
      })

      subscriptionClientRef.current.request(options.subscription).subscribe({
        next: ({ data }) => {
          options.onData(data as TSubscriptionData)
        },
      })
    }
  }, [options])

  useEffect(() => {
    return () => {
      subscriptionClientRef.current?.close()
    }
  }, [])

  return query
}
