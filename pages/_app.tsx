import { AppProps } from 'next/dist/next-server/lib/router/router'
import { useRef } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { Hydrate } from 'react-query/hydration'
import Head from 'next/head'
import '../styles/globals.css'
import { FaunaProvider } from '@/lib/fauna'
import { Client as FaunaClient } from 'faunadb'

export default function MyApp({ Component, pageProps }: AppProps) {
  const queryClientRef = useRef<QueryClient>()
  const faunaClientRef = useRef<FaunaClient>()

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <Hydrate state={pageProps.dehydratedState}>
        <FaunaProvider clientRef={faunaClientRef}>
          <Head>
            <meta charSet="UTF-8" />
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>Chatskee</title>
          </Head>
          <div className="bg-gray-100">
            <Component {...pageProps} />
          </div>
        </FaunaProvider>
      </Hydrate>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
