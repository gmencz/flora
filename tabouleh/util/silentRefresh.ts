import { FaunaAuthTokens } from '@/lib/types'

export async function silentRefresh() {
  const response = await fetch('/api/fauna/refresh', {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(
      `Received ${response.status} while silently refreshing access token`,
    )
  }

  const access = (await response.json()) as FaunaAuthTokens['access']
  return access
}
