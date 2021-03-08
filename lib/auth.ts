import {
  Collection,
  Create,
  ExprArg,
  Let,
  Now,
  Select,
  TimeAdd,
  Tokens,
  Var,
} from 'faunadb'

export function createAccessToken(instance: any, refreshToken: ExprArg) {
  return Create(Tokens(), {
    instance,
    data: {
      // We don't do anything with the type, it's just for readibility
      // in case we retrieve it later on
      type: 'access',
      // We store which refresh token created the access token
      // so we can invalidate access tokens that were granted by this refresh token.
      refreshToken,
    },
    // Access tokens live for 10 minutes
    ttl: TimeAdd(Now(), 10, 'minutes'),
  })
}

function createRefreshToken(userRef: any) {
  return Let(
    {
      userSession: Create(Collection('users_sessions'), {
        data: {
          user: userRef,
        },
      }),
    },
    Create(Tokens(), {
      instance: Select(['ref'], Var('userSession')),
      // No TTL on the refresh tokens
      data: {
        type: 'refresh',
      },
    }),
  )
}

export function createAccessAndRefreshTokens(userRef: any) {
  return Let(
    {
      userRef,
      refreshToken: createRefreshToken(Var('userRef')),
      accessToken: createAccessToken(Var('userRef'), Var('refreshToken')),
    },
    {
      refreshToken: Var('refreshToken'),
      accessToken: Var('accessToken'),
    },
  )
}
