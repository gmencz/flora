import { Client, ClientConfig } from 'faunadb'

interface InternalReference extends Record<string, unknown> {
  id: string
}

export interface Reference {
  '@ref': InternalReference
}

const baseConfig: Omit<ClientConfig, 'secret'> =
  process.env.NODE_ENV === 'production'
    ? {}
    : {
        scheme: 'http',
        domain: '127.0.0.1',
        port: 8443,
      }

export default function createClient(
  secret: string = process.env.FAUNADB_SERVER_KEY!,
) {
  const client = new Client({
    ...baseConfig,
    secret,
  })

  return client
}
