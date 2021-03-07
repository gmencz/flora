export default async function fetcher<TData>(
  input: RequestInfo,
  init?: RequestInit | undefined,
): Promise<TData> {
  const response = await fetch(input, init)
  const data = await response.json()
  return data
}
