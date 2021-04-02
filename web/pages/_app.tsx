import Head from 'next/head'
import { useRef } from 'react'
import { AppProps } from 'next/dist/next-server/lib/router/router'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { Hydrate } from 'react-query/hydration'
import { WebSocketProvider } from '@/components/Providers/WebSocket'
import { MainWsHandler } from '@/components/Providers/MainWsHandler'
import GlobalStyles from '@/components/ui/GlobalStyles'
import { WebRTCProvider } from '@/components/Providers/WebRTC'
import '../styles/globals.css'
import 'twin.macro'

export default function MyApp({ Component, pageProps }: AppProps) {
  const queryClientRef = useRef<QueryClient>()

  if (!queryClientRef.current) {
    // The reason we're choosing a default Infinity stale time
    // is because the gateway ws client will notify us when
    // we need to update a query.
    queryClientRef.current = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity } },
    })
  }

  return (
    <WebSocketProvider>
      <QueryClientProvider client={queryClientRef.current}>
        <Hydrate state={pageProps.dehydratedState}>
          <WebRTCProvider>
            <MainWsHandler />
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
          </WebRTCProvider>
          <ReactQueryDevtools />
        </Hydrate>
      </QueryClientProvider>
    </WebSocketProvider>
  )
}
