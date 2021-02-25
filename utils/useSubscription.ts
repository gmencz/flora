import { useEffect } from "react";
import {
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  useQuery,
} from "react-query";
import {
  OperationOptions,
  SubscriptionClient,
} from "subscriptions-transport-ws";

interface UseSubscriptionOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData
> extends UseQueryOptions<TQueryFnData, TError, TData> {
  wsUrl: string;
  subscription: OperationOptions;
  onData: (data: TData) => void;
}

export default function useSubscription<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData
>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TQueryFnData>,
  options: UseSubscriptionOptions<TQueryFnData, TError, TData>
) {
  const query = useQuery(queryKey, queryFn, options);

  useEffect(() => {
    const subscriptionClient = new SubscriptionClient(options.wsUrl, {
      reconnect: true,
    });

    subscriptionClient.request(options.subscription).subscribe({
      next: (data) => {
        options.onData(data as TData);
      },
    });
  }, []);

  return query;
}
