import {
  Collection,
  Create,
  Do,
  If,
  Let,
  Merge,
  Now,
  Select,
  ToString,
  Update,
  Var,
} from 'faunadb'
import admin from '@/lib/firebase/server'
import {
  AuthResult,
  CheckIfUserExists,
  CreateTokenForUser,
  GetUserByUid,
} from '@/fauna/auth/login'
import { getFirebaseUser } from '@/util/getFirebaseUser'
import { createFaunaClient } from '@/lib/fauna'
import { handler } from '@/util/handler'

export default handler().post(async (req, res) => {
  const client = createFaunaClient(process.env.FAUNADB_SERVER_KEY!)

  let firebaseUser: admin.auth.DecodedIdToken
  try {
    firebaseUser = await getFirebaseUser(req)
  } catch (error) {
    return res.status(401).json({
      message: error.message,
    })
  }

  const { name, uid, picture, email } = firebaseUser
  const baseUserData = {
    name,
    uid,
    photoURL: picture,
    email,
  }

  const { secret, user } = await client.query<AuthResult>(
    Let(
      {
        baseUserData,
      },
      If(
        CheckIfUserExists(uid),

        Let(
          {
            user: GetUserByUid(uid),
            userRef: Select(['ref'], Var('user')),
          },
          Do(
            Update(Var('userRef'), {
              data: Var('baseUserData'),
            }),

            Merge(CreateTokenForUser(Var('userRef')), {
              user: {
                id: Select(['id'], Var('userRef')),
                name: Select(['data', 'name'], Var('user')),
                email: Select(['data', 'email'], Var('user')),
                photoURL: Select(['data', 'photoURL'], Var('user')),
                firebaseUid: Select(['data', 'uid'], Var('user')),
                created: ToString(Select(['data', 'created'], Var('user'))),
              },
            }),
          ),
        ),

        Do(
          Create(Collection('users'), {
            data: Merge(Var('baseUserData'), { created: Now() }),
          }),

          Let(
            {
              user: GetUserByUid(uid),
              userRef: Select(['ref'], Var('user')),
            },

            Merge(CreateTokenForUser(Var('userRef')), {
              user: {
                id: Select(['id'], Var('userRef')),
                name: Select(['data', 'name'], Var('user')),
                email: Select(['data', 'email'], Var('user')),
                photoURL: Select(['data', 'photoURL'], Var('user')),
                firebaseUid: Select(['data', 'uid'], Var('user')),
                created: ToString(Select(['data', 'created'], Var('user'))),
              },
            }),
          ),
        ),
      ),
    ),
  )

  req.session.set('user', {
    faunaToken: secret,
  })

  await req.session.save()
  return res.json(user)
})
