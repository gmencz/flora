import { Client as FaunaClient, ClientConfig } from 'faunadb'

const baseConfig: Omit<ClientConfig, 'secret'> =
  process.env.NODE_ENV === 'production'
    ? {}
    : {
        scheme: 'http',
        domain: '127.0.0.1',
        port: 8443,
      }

export function createFaunaClient(secret: string) {
  const client = new FaunaClient({
    ...baseConfig,
    secret,
  })

  return client
}
