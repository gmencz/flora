import setCookie from '@/util/setCookie'
import {
  And,
  Collection,
  Create,
  CurrentIdentity,
  CurrentToken,
  Delete,
  Do,
  Equals,
  Exists,
  Expr,
  ExprArg,
  Get,
  GTE,
  HasCurrentToken,
  If,
  Index,
  Lambda,
  Let,
  Map,
  Match,
  NewId,
  Now,
  Paginate,
  Select,
  TimeAdd,
  TimeDiff,
  Tokens,
  Update,
  Var,
} from 'faunadb'
import { NextApiResponse } from 'next'

export const ACCESS_TOKEN_LIFETIME_SECONDS = 600 // 10 minutes
export const RESET_TOKEN_LIFETIME_SECONDS = 1800 // 30 minutes
export const REFRESH_TOKEN_LIFETIME_SECONDS = 28800 // 8 hours

export function CreateAccessToken(instance: any, refreshTokenRef: ExprArg) {
  return Create(Tokens(), {
    instance,
    // A token is a document just like everything else in Fauna.
    // We will store extra metadata on the token to identify the token type.
    data: {
      type: 'access',
      // We store which refresh token that created the access tokens which allows us to easily invalidate
      // all access tokens created by a specific refresh token.
      refresh: refreshTokenRef,
    },
    // access tokens live for 10 minutes, which is typically a good ttl for short-lived tokens.
    ttl: TimeAdd(Now(), ACCESS_TOKEN_LIFETIME_SECONDS, 'seconds'),
  })
}

function CreateRefreshToken(userRef: any) {
  return Create(Tokens(), {
    instance: userRef,
    data: {
      type: 'refresh',
      used: false,
      sessionId: CreateOrReuseId(),
    },
    // 8 hours is a good time for refresh tokens.
    ttl: TimeAdd(Now(), REFRESH_TOKEN_LIFETIME_SECONDS, 'seconds'),
  })
}

function CreateOrReuseId() {
  return If(IsCalledWithRefreshToken(), GetSessionId(), NewId())
}

export function GetSessionId() {
  return Select(['data', 'sessionId'], Get(CurrentToken()))
}

export function CreateAccessAndRefreshToken(userRef: any) {
  return Let(
    {
      refresh: CreateRefreshToken(userRef),
      access: CreateAccessToken(userRef, Var('refresh')),
    },
    {
      refresh: Var('refresh'),
      access: Var('access'),
    },
  )
}

export function InvalidateAccessAndRefreshToken(refreshTokenRef: any) {
  return Do(
    InvalidateAccessToken(refreshTokenRef),
    InvalidateRefreshToken(refreshTokenRef),
  )
}

export function InvalidateRefreshToken(refreshTokenRef: any) {
  return Update(refreshTokenRef, { data: { used: true, timeUsed: Now() } })
}

export function InvalidateAccessToken(refreshTokenRef: any) {
  return If(
    Exists(Match(Index('access_token_by_refresh_token'), refreshTokenRef)),
    Delete(
      Select(
        ['ref'],
        Get(Match(Index('access_token_by_refresh_token'), refreshTokenRef)),
      ),
    ),
    false,
  )
}

export function LogoutAccessAndRefreshToken(refreshTokenRef: any) {
  return Do(InvalidateAccessToken(refreshTokenRef), Delete(refreshTokenRef))
}

export function IsCalledWithAccessToken() {
  return Equals(Select(['data', 'type'], Get(CurrentToken()), false), 'access')
}

export function IsCalledWithRefreshToken() {
  return And(
    HasCurrentToken(),
    Equals(Select(['data', 'type'], Get(CurrentToken()), false), 'refresh'),
  )
}

export const GRACE_PERIOD_SECONDS = 20 // 20 seconds

export function RefreshToken() {
  return Let(
    {
      currentToken: CurrentToken(),
    },
    If(
      And(IsTokenUsed(), IsGracePeriodExpired(GRACE_PERIOD_SECONDS)),
      LogRefreshTokenReuseAnomaly(Var('currentToken')),
      RotateAccessAndRefreshToken(Var('currentToken')),
    ),
  )
}

export const REFRESH_TOKEN_REUSE_ERROR = {
  code: 'REFRESH_TOKEN_REUSE',
  message:
    'The refresh token was used outside of the grace period which indicates that it was leaked',
}

export function LogRefreshTokenReuseAnomaly(tokenRef: any) {
  return Do(
    // Log the anomaly
    Create(Collection('anomalies'), {
      data: {
        error: REFRESH_TOKEN_REUSE_ERROR,
        token: tokenRef,
      },
    }),
    // Return the error
    REFRESH_TOKEN_REUSE_ERROR,
  )
}

export function IsTokenUsed() {
  return Select(['data', 'used'], Get(CurrentToken()))
}

function IsGracePeriodExpired(gracePeriodSeconds: number) {
  return GTE(GetAgeOfRefreshToken(), gracePeriodSeconds * 1000)
}

export function GetAgeOfRefreshToken() {
  return Let(
    {
      timeUsed: Select(['data', 'timeUsed'], Get(CurrentToken())),
      ageInMS: TimeDiff(Var('timeUsed'), Now(), 'milliseconds'),
    },
    Var('ageInMS'),
  )
}

function RotateAccessAndRefreshToken(refreshTokenRef: any) {
  return Do(
    InvalidateAccessAndRefreshToken(refreshTokenRef),
    CreateAccessAndRefreshToken(CurrentIdentity()),
  )
}

// Logout is called with the refresh token.
export function Logout(all: Expr) {
  return If(all, LogoutAll(), LogoutOne())
}

// Logout the access and refresh token for the refresh token provided (which corresponds to one browser)
function LogoutOne() {
  return Let(
    {
      refreshTokens: Paginate(
        Match(
          Index('tokens_by_instance_sessionid_type_and_used'),
          CurrentIdentity(),
          GetSessionId(),
          'refresh',
          false,
        ),
        { size: 100000 },
      ),
    },
    Map(
      Var('refreshTokens'),
      Lambda(['token'], LogoutAccessAndRefreshToken(Var('token'))),
    ),
  )
}

// Logout all tokens for an accounts (which could be on different machines or different browsers)
function LogoutAll() {
  return Let(
    {
      refreshTokens: Paginate(
        Match(
          Index('tokens_by_instance_type_and_used'),
          CurrentIdentity(),
          'refresh',
          false,
        ),
        { size: 100000 },
      ),
    },
    Map(
      Var('refreshTokens'),
      Lambda(['token'], LogoutAccessAndRefreshToken(Var('token'))),
    ),
  )
}

export function setRefreshTokenCookie(res: NextApiResponse, token: string) {
  setCookie(res, 'chatskeeFaunaRefresh', token, {
    maxAge: REFRESH_TOKEN_LIFETIME_SECONDS,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

export function clearRefreshTokenCookie(res: NextApiResponse) {
  setCookie(res, 'chatskeeFaunaRefresh', '', {
    maxAge: -1,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}
