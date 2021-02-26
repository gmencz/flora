import { GraphQLClient } from 'graphql-request'
import {
  useQuery,
  UseQueryOptions,
  useMutation,
  UseMutationOptions,
} from 'react-query'
export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> }

function fetcher<TData, TVariables>(
  client: GraphQLClient,
  query: string,
  variables?: TVariables,
) {
  return async (): Promise<TData> =>
    client.request<TData, TVariables>(query, variables)
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  timestamptz: string
}

/** expression to compare columns of type String. All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: Maybe<Scalars['String']>
  _gt?: Maybe<Scalars['String']>
  _gte?: Maybe<Scalars['String']>
  _ilike?: Maybe<Scalars['String']>
  _in?: Maybe<Array<Scalars['String']>>
  _is_null?: Maybe<Scalars['Boolean']>
  _like?: Maybe<Scalars['String']>
  _lt?: Maybe<Scalars['String']>
  _lte?: Maybe<Scalars['String']>
  _neq?: Maybe<Scalars['String']>
  _nilike?: Maybe<Scalars['String']>
  _nin?: Maybe<Array<Scalars['String']>>
  _nlike?: Maybe<Scalars['String']>
  _nsimilar?: Maybe<Scalars['String']>
  _similar?: Maybe<Scalars['String']>
}

/** columns and relationships of "messages" */
export type Messages = {
  __typename?: 'messages'
  content: Scalars['String']
  guest_name: Scalars['String']
  id: Scalars['String']
  sent_at: Scalars['timestamptz']
}

/** aggregated selection of "messages" */
export type Messages_Aggregate = {
  __typename?: 'messages_aggregate'
  aggregate?: Maybe<Messages_Aggregate_Fields>
  nodes: Array<Messages>
}

/** aggregate fields of "messages" */
export type Messages_Aggregate_Fields = {
  __typename?: 'messages_aggregate_fields'
  count?: Maybe<Scalars['Int']>
  max?: Maybe<Messages_Max_Fields>
  min?: Maybe<Messages_Min_Fields>
}

/** aggregate fields of "messages" */
export type Messages_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<Messages_Select_Column>>
  distinct?: Maybe<Scalars['Boolean']>
}

/** order by aggregate values of table "messages" */
export type Messages_Aggregate_Order_By = {
  count?: Maybe<Order_By>
  max?: Maybe<Messages_Max_Order_By>
  min?: Maybe<Messages_Min_Order_By>
}

/** input type for inserting array relation for remote table "messages" */
export type Messages_Arr_Rel_Insert_Input = {
  data: Array<Messages_Insert_Input>
  on_conflict?: Maybe<Messages_On_Conflict>
}

/** Boolean expression to filter rows from the table "messages". All fields are combined with a logical 'AND'. */
export type Messages_Bool_Exp = {
  _and?: Maybe<Array<Maybe<Messages_Bool_Exp>>>
  _not?: Maybe<Messages_Bool_Exp>
  _or?: Maybe<Array<Maybe<Messages_Bool_Exp>>>
  content?: Maybe<String_Comparison_Exp>
  guest_name?: Maybe<String_Comparison_Exp>
  id?: Maybe<String_Comparison_Exp>
  sent_at?: Maybe<Timestamptz_Comparison_Exp>
}

/** unique or primary key constraints on table "messages" */
export enum Messages_Constraint {
  /** unique or primary key constraint */
  MessagesPkey = 'messages_pkey',
}

/** input type for inserting data into table "messages" */
export type Messages_Insert_Input = {
  content?: Maybe<Scalars['String']>
  guest_name?: Maybe<Scalars['String']>
  id?: Maybe<Scalars['String']>
  sent_at?: Maybe<Scalars['timestamptz']>
}

/** aggregate max on columns */
export type Messages_Max_Fields = {
  __typename?: 'messages_max_fields'
  content?: Maybe<Scalars['String']>
  guest_name?: Maybe<Scalars['String']>
  id?: Maybe<Scalars['String']>
  sent_at?: Maybe<Scalars['timestamptz']>
}

/** order by max() on columns of table "messages" */
export type Messages_Max_Order_By = {
  content?: Maybe<Order_By>
  guest_name?: Maybe<Order_By>
  id?: Maybe<Order_By>
  sent_at?: Maybe<Order_By>
}

/** aggregate min on columns */
export type Messages_Min_Fields = {
  __typename?: 'messages_min_fields'
  content?: Maybe<Scalars['String']>
  guest_name?: Maybe<Scalars['String']>
  id?: Maybe<Scalars['String']>
  sent_at?: Maybe<Scalars['timestamptz']>
}

/** order by min() on columns of table "messages" */
export type Messages_Min_Order_By = {
  content?: Maybe<Order_By>
  guest_name?: Maybe<Order_By>
  id?: Maybe<Order_By>
  sent_at?: Maybe<Order_By>
}

/** response of any mutation on the table "messages" */
export type Messages_Mutation_Response = {
  __typename?: 'messages_mutation_response'
  /** number of affected rows by the mutation */
  affected_rows: Scalars['Int']
  /** data of the affected rows by the mutation */
  returning: Array<Messages>
}

/** input type for inserting object relation for remote table "messages" */
export type Messages_Obj_Rel_Insert_Input = {
  data: Messages_Insert_Input
  on_conflict?: Maybe<Messages_On_Conflict>
}

/** on conflict condition type for table "messages" */
export type Messages_On_Conflict = {
  constraint: Messages_Constraint
  update_columns: Array<Messages_Update_Column>
  where?: Maybe<Messages_Bool_Exp>
}

/** ordering options when selecting data from "messages" */
export type Messages_Order_By = {
  content?: Maybe<Order_By>
  guest_name?: Maybe<Order_By>
  id?: Maybe<Order_By>
  sent_at?: Maybe<Order_By>
}

/** primary key columns input for table: "messages" */
export type Messages_Pk_Columns_Input = {
  id: Scalars['String']
}

/** select columns of table "messages" */
export enum Messages_Select_Column {
  /** column name */
  Content = 'content',
  /** column name */
  GuestName = 'guest_name',
  /** column name */
  Id = 'id',
  /** column name */
  SentAt = 'sent_at',
}

/** input type for updating data in table "messages" */
export type Messages_Set_Input = {
  content?: Maybe<Scalars['String']>
  guest_name?: Maybe<Scalars['String']>
  id?: Maybe<Scalars['String']>
  sent_at?: Maybe<Scalars['timestamptz']>
}

/** update columns of table "messages" */
export enum Messages_Update_Column {
  /** column name */
  Content = 'content',
  /** column name */
  GuestName = 'guest_name',
  /** column name */
  Id = 'id',
  /** column name */
  SentAt = 'sent_at',
}

/** mutation root */
export type Mutation_Root = {
  __typename?: 'mutation_root'
  /** delete data from the table: "messages" */
  delete_messages?: Maybe<Messages_Mutation_Response>
  /** delete single row from the table: "messages" */
  delete_messages_by_pk?: Maybe<Messages>
  /** insert data into the table: "messages" */
  insert_messages?: Maybe<Messages_Mutation_Response>
  /** insert a single row into the table: "messages" */
  insert_messages_one?: Maybe<Messages>
  /** update data of the table: "messages" */
  update_messages?: Maybe<Messages_Mutation_Response>
  /** update single row of the table: "messages" */
  update_messages_by_pk?: Maybe<Messages>
}

/** mutation root */
export type Mutation_RootDelete_MessagesArgs = {
  where: Messages_Bool_Exp
}

/** mutation root */
export type Mutation_RootDelete_Messages_By_PkArgs = {
  id: Scalars['String']
}

/** mutation root */
export type Mutation_RootInsert_MessagesArgs = {
  objects: Array<Messages_Insert_Input>
  on_conflict?: Maybe<Messages_On_Conflict>
}

/** mutation root */
export type Mutation_RootInsert_Messages_OneArgs = {
  object: Messages_Insert_Input
  on_conflict?: Maybe<Messages_On_Conflict>
}

/** mutation root */
export type Mutation_RootUpdate_MessagesArgs = {
  _set?: Maybe<Messages_Set_Input>
  where: Messages_Bool_Exp
}

/** mutation root */
export type Mutation_RootUpdate_Messages_By_PkArgs = {
  _set?: Maybe<Messages_Set_Input>
  pk_columns: Messages_Pk_Columns_Input
}

/** column ordering options */
export enum Order_By {
  /** in the ascending order, nulls last */
  Asc = 'asc',
  /** in the ascending order, nulls first */
  AscNullsFirst = 'asc_nulls_first',
  /** in the ascending order, nulls last */
  AscNullsLast = 'asc_nulls_last',
  /** in the descending order, nulls first */
  Desc = 'desc',
  /** in the descending order, nulls first */
  DescNullsFirst = 'desc_nulls_first',
  /** in the descending order, nulls last */
  DescNullsLast = 'desc_nulls_last',
}

/** query root */
export type Query_Root = {
  __typename?: 'query_root'
  /** fetch data from the table: "messages" */
  messages: Array<Messages>
  /** fetch aggregated fields from the table: "messages" */
  messages_aggregate: Messages_Aggregate
  /** fetch data from the table: "messages" using primary key columns */
  messages_by_pk?: Maybe<Messages>
}

/** query root */
export type Query_RootMessagesArgs = {
  distinct_on?: Maybe<Array<Messages_Select_Column>>
  limit?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
  order_by?: Maybe<Array<Messages_Order_By>>
  where?: Maybe<Messages_Bool_Exp>
}

/** query root */
export type Query_RootMessages_AggregateArgs = {
  distinct_on?: Maybe<Array<Messages_Select_Column>>
  limit?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
  order_by?: Maybe<Array<Messages_Order_By>>
  where?: Maybe<Messages_Bool_Exp>
}

/** query root */
export type Query_RootMessages_By_PkArgs = {
  id: Scalars['String']
}

/** subscription root */
export type Subscription_Root = {
  __typename?: 'subscription_root'
  /** fetch data from the table: "messages" */
  messages: Array<Messages>
  /** fetch aggregated fields from the table: "messages" */
  messages_aggregate: Messages_Aggregate
  /** fetch data from the table: "messages" using primary key columns */
  messages_by_pk?: Maybe<Messages>
}

/** subscription root */
export type Subscription_RootMessagesArgs = {
  distinct_on?: Maybe<Array<Messages_Select_Column>>
  limit?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
  order_by?: Maybe<Array<Messages_Order_By>>
  where?: Maybe<Messages_Bool_Exp>
}

/** subscription root */
export type Subscription_RootMessages_AggregateArgs = {
  distinct_on?: Maybe<Array<Messages_Select_Column>>
  limit?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
  order_by?: Maybe<Array<Messages_Order_By>>
  where?: Maybe<Messages_Bool_Exp>
}

/** subscription root */
export type Subscription_RootMessages_By_PkArgs = {
  id: Scalars['String']
}

/** expression to compare columns of type timestamptz. All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: Maybe<Scalars['timestamptz']>
  _gt?: Maybe<Scalars['timestamptz']>
  _gte?: Maybe<Scalars['timestamptz']>
  _in?: Maybe<Array<Scalars['timestamptz']>>
  _is_null?: Maybe<Scalars['Boolean']>
  _lt?: Maybe<Scalars['timestamptz']>
  _lte?: Maybe<Scalars['timestamptz']>
  _neq?: Maybe<Scalars['timestamptz']>
  _nin?: Maybe<Array<Scalars['timestamptz']>>
}

export type MessageFragment = { __typename?: 'messages' } & Pick<
  Messages,
  'id' | 'sent_at' | 'guest_name' | 'content'
>

export type LatestMessagesQueryVariables = Exact<{ [key: string]: never }>

export type LatestMessagesQuery = { __typename?: 'query_root' } & {
  messages: Array<{ __typename?: 'messages' } & MessageFragment>
}

export type OnNewMessageSubscriptionVariables = Exact<{ [key: string]: never }>

export type OnNewMessageSubscription = { __typename?: 'subscription_root' } & {
  messages: Array<{ __typename?: 'messages' } & MessageFragment>
}

export type NewMessageMutationVariables = Exact<{
  input: Messages_Insert_Input
}>

export type NewMessageMutation = { __typename?: 'mutation_root' } & {
  insert_messages_one?: Maybe<{ __typename?: 'messages' } & MessageFragment>
}

export const MessageFragmentDoc = `
    fragment Message on messages {
  id
  sent_at
  guest_name
  content
}
    `
export const LatestMessagesDocument = `
    query LatestMessages {
  messages(order_by: {sent_at: desc}, limit: 30) {
    ...Message
  }
}
    ${MessageFragmentDoc}`
export const useLatestMessagesQuery = <
  TData = LatestMessagesQuery,
  TError = unknown
>(
  client: GraphQLClient,
  variables?: LatestMessagesQueryVariables,
  options?: UseQueryOptions<LatestMessagesQuery, TError, TData>,
) =>
  useQuery<LatestMessagesQuery, TError, TData>(
    ['LatestMessages', variables],
    fetcher<LatestMessagesQuery, LatestMessagesQueryVariables>(
      client,
      LatestMessagesDocument,
      variables,
    ),
    options,
  )
export const OnNewMessageDocument = `
    subscription OnNewMessage {
  messages(order_by: {sent_at: desc}, limit: 1) {
    ...Message
  }
}
    ${MessageFragmentDoc}`
export const NewMessageDocument = `
    mutation NewMessage($input: messages_insert_input!) {
  insert_messages_one(object: $input) {
    ...Message
  }
}
    ${MessageFragmentDoc}`
export const useNewMessageMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    NewMessageMutation,
    TError,
    NewMessageMutationVariables,
    TContext
  >,
) =>
  useMutation<
    NewMessageMutation,
    TError,
    NewMessageMutationVariables,
    TContext
  >(
    (variables?: NewMessageMutationVariables) =>
      fetcher<NewMessageMutation, NewMessageMutationVariables>(
        client,
        NewMessageDocument,
        variables,
      )(),
    options,
  )
