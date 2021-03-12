import Tooltip from '@/components/ui/Tooltip'
import Link from 'next/link'
import List from './List'
import 'twin.macro'
import { useRouter } from 'next/router'
import tw from 'twin.macro'

const homePaths = ['dms', 'friends']

function ServersSidebar() {
  const router = useRouter()

  const homePathMatches = homePaths.some(
    path =>
      router.asPath.startsWith(`/app/${path}`) || router.asPath === '/app',
  )

  return (
    <aside tw="flex sticky top-0 z-20 flex-col py-4 w-servers-sidebar bg-gray-400 min-h-screen max-h-screen space-y-3">
      <ul tw="flex justify-center">
        <li tw="relative">
          <Tooltip label="Home" position="right">
            <Link passHref href="/app">
              <a
                css={[
                  tw`flex h-12 w-12 justify-center items-center bg-white p-2 rounded-2xl group-hover:bg-brand-500 transition-colors`,

                  homePathMatches && tw`bg-brand-500 text-white`,
                ]}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  css={[
                    tw`w-full text-gray-800 group-hover:text-white`,
                    homePathMatches && tw`text-white`,
                  ]}
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span tw="sr-only">Home</span>
              </a>
            </Link>
          </Tooltip>
        </li>
      </ul>

      {/* Divider */}
      <div tw="h-0.5 w-1/3 bg-gray-300 self-center" />

      <nav>
        {/* Servers list */}
        <ul tw="flex flex-col items-center space-y-2">
          <List />

          <li tw="relative">
            <Tooltip label="Add a Server (Soon&trade;)" position="right">
              <div className="group">
                {/* <Link href="/app/servers/new"> */}
                <a tw="flex cursor-not-allowed h-12 w-12 justify-center items-center bg-white p-2 rounded-2xl group-hover:bg-brand-500 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    tw="w-full text-gray-800 group-hover:text-white"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>

                  <span tw="sr-only">Add a Server</span>
                </a>
                {/* </Link> */}
              </div>
            </Tooltip>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default ServersSidebar
