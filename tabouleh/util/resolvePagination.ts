import { Expr, Get, If, IsNull, Let, Select, Var } from 'faunadb'

export interface ResolvedPagination<TData> {
  data: TData
  after: string | null
  before: string | null
}

export default function resolvePagination<TData>(
  page: Expr,
): ResolvedPagination<TData> {
  return {
    data: Select(['data'], page) as TData,
    after: Let(
      {
        after: Select(['after', 0], page, null as any),
      },
      If(
        IsNull(Var('after')),
        null,
        Select(['ref', 'id'], Get(Var('after')), null as any),
      ),
    ) as string,
    before: Let(
      {
        before: Select(['before', 0], page, null as any),
      },
      If(
        IsNull(Var('before')),
        null,
        Select(['ref', 'id'], Get(Var('before')), null as any),
      ),
    ) as string,
  }
}
