import { useEffect, useRef } from "react";
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
  subscription: OperationOptions;
  onData: (data: TData) => void;
  runOnInitialData?: boolean;
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
  const isInitialDataRef = useRef(true);

  useEffect(() => {
    const subscriptionClient = new SubscriptionClient(
      "ws://localhost:8080/v1/graphql",
      {
        reconnect: true,
      }
    );

    subscriptionClient.request(options.subscription).subscribe({
      next: (data) => {
        if (!isInitialDataRef.current || options.runOnInitialData) {
          options.onData(data as TData);
        }

        isInitialDataRef.current = false;
      },
    });
  }, []);

  return query;
}
