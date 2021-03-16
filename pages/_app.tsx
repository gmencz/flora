import { AppProps } from 'next/dist/next-server/lib/router/router'
import { useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { Hydrate } from 'react-query/hydration'
import { Client as FaunaClient } from 'faunadb'
import Head from 'next/head'
import '../styles/globals.css'
import { createClient, FaunaClientProvider } from '@/lib/FaunaClient'
import GlobalStyles from '@/components/ui/GlobalStyles'
import 'twin.macro'

export default function MyApp({ Component, pageProps }: AppProps) {
  const queryClientRef = useRef<QueryClient>()
  const faunaClientRef = useRef<FaunaClient>()
  const silentRefreshRef = useRef<NodeJS.Timeout>()
  const [accessToken, setAccessToken] = useState<string>('')

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  if (!faunaClientRef.current) {
    faunaClientRef.current = createClient('')
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <Hydrate state={pageProps.dehydratedState}>
        <FaunaClientProvider
          accessToken={accessToken}
          setAccessToken={setAccessToken}
          silentRefreshRef={silentRefreshRef}
          client={faunaClientRef.current}
        >
          <>
            <Head>
              <meta charSet="UTF-8" />
              <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <title>Chatskee</title>
            </Head>
            <GlobalStyles />
            <div tw="bg-gray-100">
              <Component {...pageProps} />
            </div>
          </>
        </FaunaClientProvider>
      </Hydrate>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
