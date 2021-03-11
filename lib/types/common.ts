export interface Page<TData> {
  data: TData[]
  before: string | null
  after: string | null
}
