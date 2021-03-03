import faunadb from 'faunadb'

const config: faunadb.ClientConfig =
  process.env.NODE_ENV === 'production'
    ? { secret: process.env.NEXT_PUBLIC_FAUNADB_KEY! }
    : {
        secret: process.env.NEXT_PUBLIC_FAUNADB_KEY!,
        scheme: 'http',
        domain: '127.0.0.1',
        port: 8443,
      }

const client = new faunadb.Client(config)

const q = faunadb.query

export { client, q }
