import faunadb from 'faunadb'
const q = faunadb.query
const { Do, Create, Collection, CurrentToken, CurrentIdentity } = q

interface RefreshError {
  code: string
  message: string
}

export const REFRESH_TOKEN_REUSE_ERROR: RefreshError = {
  code: 'REFRESH_TOKEN_REUSE',
  message:
    'The refresh token was used outside of the grace period which indicates that it was leaked',
}

export const REFRESH_TOKEN_EXPIRED: RefreshError = {
  code: 'REFRESH_TOKEN_EXPIRED',
  message: 'The refresh token was expired',
}

export const REFRESH_TOKEN_USED_AFTER_LOGOUT: RefreshError = {
  code: 'REFRESH_TOKEN_USED_AFTER_LOGOUT',
  message: 'The refresh token was used after logging out',
}

export function LogAnomaly(error: RefreshError, action: string) {
  return Do(
    // Log the anomaly
    Create(Collection('anomalies'), {
      data: {
        error,
        token: CurrentToken(),
        user: CurrentIdentity(),
        action,
      },
    }),
    // Return the error
    error,
  )
}
