import faunadb, { ExprArg, If } from 'faunadb'
import {
  LogAnomaly,
  REFRESH_TOKEN_EXPIRED,
  REFRESH_TOKEN_REUSE_ERROR,
  REFRESH_TOKEN_USED_AFTER_LOGOUT,
} from './anomalies'

const q = faunadb.query
const {
  Let,
  Var,
  Create,
  Select,
  Tokens,
  Now,
  TimeAdd,
  Equals,
  Get,
  CurrentToken,
  HasCurrentToken,
  Exists,
  Update,
  Match,
  Index,
  NewId,
  Do,
  Delete,
  And,
  GT,
  CurrentIdentity,
  Not,
} = q

export const ACCESS_TOKEN_LIFETIME_SECONDS = 600 // 10 minutes
// lifetime of the token makes the refresh token unusable after this lifetime since
// the code explicitely checks that lifetime before allowing a refresh token to refresh.
export const REFRESH_TOKEN_LIFETIME_SECONDS = 28800 // 8 hours
// reclaim time deletes the token which makes it unable to detect leaked tokens.
// which is why it is set rather high.
export const REFRESH_TOKEN_RECLAIMTIME_SECONDS = 604800 // 1 week
// when a refresh token is refreshed itself, allow a grace period to make sure parallel requests work.
export const GRACE_PERIOD_SECONDS = 20

/********************************************
  Creation of tokens
********************************************/
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

export function CreateRefreshToken(userRef: any) {
  return Create(Tokens(), {
    instance: userRef,
    data: {
      type: 'refresh',
      used: false,
      sessionId: CreateOrReuseId(),
      validUntil: TimeAdd(Now(), REFRESH_TOKEN_LIFETIME_SECONDS, 'seconds'),
      loggedOut: false,
    },
    ttl: TimeAdd(Now(), REFRESH_TOKEN_RECLAIMTIME_SECONDS, 'seconds'),
  })
}

export function CreateAccessAndRefreshToken(userRef: any) {
  return Let(
    {
      refresh: CreateRefreshToken(userRef),
      access: CreateAccessToken(userRef, Select(['ref'], Var('refresh'))),
    },
    {
      refresh: Var('refresh'),
      access: Var('access'),
    },
  )
}

function CreateOrReuseId() {
  return If(IsCalledWithRefreshToken(), GetSessionId(), NewId())
}

export function GetSessionId() {
  return Select(['data', 'sessionId'], Get(CurrentToken()))
}

export function RotateAccessAndRefreshToken() {
  return Do(
    InvalidateRefreshToken(CurrentToken()),
    CreateAccessAndRefreshToken(CurrentIdentity()),
  )
}

/********************************************
  Verification of tokens and/or verify validity of tokens
********************************************/
export function IsCalledWithAccessToken() {
  return And(
    HasCurrentToken(),
    Equals(Select(['data', 'type'], Get(CurrentToken()), false), 'access'),
  )
}

export function IsCalledWithRefreshToken() {
  return And(
    HasCurrentToken(),
    Equals(Select(['data', 'type'], Get(CurrentToken()), false), 'refresh'),
  )
}

export function VerifyRefreshToken(
  fqlStatementOnSuccessfulVerification: any,
  action: string,
) {
  return If(
    And(IsTokenUsed(), Not(IsWithinGracePeriod())),
    LogAnomaly(REFRESH_TOKEN_REUSE_ERROR, action),
    If(
      IsTokenStillValid(),
      If(
        Not(IsTokenLoggedOut()),
        fqlStatementOnSuccessfulVerification,
        LogAnomaly(REFRESH_TOKEN_USED_AFTER_LOGOUT, action),
      ),
      LogAnomaly(REFRESH_TOKEN_EXPIRED, action),
    ),
  )
}

export function IsTokenLoggedOut() {
  return Select(['data', 'loggedOut'], Get(CurrentToken()))
}

export function IsTokenUsed() {
  return Select(['data', 'used'], Get(CurrentToken()))
}

export function IsTokenStillValid() {
  return GT(Select(['data', 'validUntil'], Get(CurrentToken())), Now())
}

function IsWithinGracePeriod() {
  return GT(Select(['data', 'gracePeriodUntil'], Get(CurrentToken())), Now())
}

/********************************************
  Invalidate/Delete/Logout of tokens
********************************************/
export function InvalidateRefreshToken(refreshTokenRef: any) {
  return Update(refreshTokenRef, {
    data: {
      used: true,
      gracePeriodUntil: TimeAdd(Now(), GRACE_PERIOD_SECONDS, 'seconds'),
    },
  })
}

function InvalidateAccessToken(refreshTokenRef: any) {
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

function LogoutRefreshToken(refreshTokenRef: any) {
  return Update(refreshTokenRef, { data: { loggedOut: true } })
}

export function LogoutAccessAndRefreshToken(refreshTokenRef: any) {
  return Do(
    InvalidateAccessToken(refreshTokenRef),
    LogoutRefreshToken(refreshTokenRef),
  )
}
