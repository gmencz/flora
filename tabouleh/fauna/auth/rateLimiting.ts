import { CurrentIdentity, Expr, query as q } from 'faunadb'

type RateLimitingAction = 'default'

interface RateLimitingConfig {
  calls: number
  maxAgeInMs: number
}

// NOTE: We don't need to worry about rate limiting logins/signups
// because firebase takes care of this.
const rateLimitingConfig: Record<RateLimitingAction, RateLimitingConfig> = {
  default: {
    calls: 75,
    maxAgeInMs: 3_600_000, // 75 calls every hour by default.
  },
}

function VerifyRateLimitingAndUpdate(
  action: RateLimitingAction,
  numberOfEvents: number,
  maxAgeInMs: number,
  FqlQueryToExecute: Expr,
) {
  return q.Let(
    // We split up the calculation for educational purposes. First we get the first X events of the ratelimiting entry in reverse order (before: null does that)
    {
      eventsPage: q.Paginate(
        q.Events(q.Select(['data', 0], q.Var('rateLimitingPage'))),
        {
          size: numberOfEvents,
          before: null,
        },
      ),
      page: q.Select(['data'], q.Var('eventsPage')),
      // then we retrieve the first element of that page. If X would be 3, it would be the 3th oldest event
      firstEventOfPage: q.Select([0], q.Var('page')),
      // then we get the timestamp of the event
      timestamp: q.Select(['ts'], q.Var('firstEventOfPage')),
      // transform the Fauna timestamp to a Time object
      time: q.Epoch(q.Var('timestamp'), 'microseconds'),
      // How long ago was that event in ms
      ageInMs: q.TimeDiff(q.Var('time'), q.Now(), 'milliseconds'),
    },
    q.If(
      // if there are 'numberOfEvents' timestamps in the page, take the first of the page and see if it is old enough
      // If maxAgeInMs is 0 we don't care about the time, something in the FqlQueryToExecute will reset
      // delete the rate-limiting events in order to reset (e.g. useful for max 3 faulty logins).
      q.Or(
        q.LT(q.Count(q.Var('page')), numberOfEvents),
        q.And(
          q.Not(q.Equals(0, maxAgeInMs)),
          q.GTE(q.Var('ageInMs'), maxAgeInMs),
        ),
      ),
      // Then great we update
      q.Do(
        q.Update(q.Select(['document'], q.Var('firstEventOfPage')), {
          data: {
            action: action,
            identity: CurrentIdentity(),
          },
        }),
        FqlQueryToExecute,
      ),
      // Else.. Abort! Rate-limiting in action
      q.Abort(`Too Many Requests for ${action} action`),
    ),
  )
}

/**
 *
 * @param FqlQueryToExecute The FQL query to execute.
 * @param action The unique identifier of the action being rate limited, `default` will be used to apply the default rate limiting if none is provided.
 * @returns The data returned by the FQL query.
 */
export function AddRateLimiting<TQueryData = Expr>(
  FqlQueryToExecute: Expr,
  action?: RateLimitingAction,
) {
  const configAction = action ?? 'default'
  const config = rateLimitingConfig[configAction]

  return q.Let(
    {
      rateLimitingPage: q.Paginate(
        q.Match(
          q.Index('rate_limiting_by_action_and_identity'),
          configAction,
          CurrentIdentity(),
        ),
      ),
    },
    q.If(
      // Check whether there is a value
      q.IsEmpty(q.Var('rateLimitingPage')),
      // THEN: we store the initial data. Since our collection has a Time To Live set to one day.
      // older data will be automatically reclaimed (e.g. users that don't use the application anymore),
      q.Do(
        q.Create(q.Collection('rate_limiting'), {
          data: {
            action: configAction,
            identity: CurrentIdentity(),
          },
        }),
        FqlQueryToExecute,
      ),
      // ELSE: we actually retrieve a page of the last X events for this rate limiting entry, take the first (the oldest of this page)
      // and verify whether they are long enough ago to allow another call.
      VerifyRateLimitingAndUpdate(
        configAction,
        config.calls,
        config.maxAgeInMs,
        FqlQueryToExecute,
      ),
    ),
  ) as TQueryData
}
