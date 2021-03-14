import Link from 'next/link'
import { useRouter } from 'next/router'
import tw from 'twin.macro'

function FriendsHeader() {
  const router = useRouter()

  return (
    <header tw="py-4 sticky top-0 px-6 bg-gray-100 shadow-sm">
      <nav tw="flex space-x-8 items-center">
        <div tw="flex space-x-2.5 items-center border-r pr-4 border-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            tw="w-6 h-6 text-gray-500"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>

          <span tw="text-sm font-bold text-gray-900">Friends</span>
        </div>

        <ul tw="flex space-x-8 items-center">
          <li>
            <Link passHref href="/app">
              <a
                css={[
                  tw`text-sm font-semibold rounded text-gray-600 px-2 py-1`,
                  router.asPath === '/app'
                    ? tw`bg-gray-200 text-gray-800`
                    : tw`hover:bg-gray-200 hover:text-gray-700`,
                ]}
              >
                All
              </a>
            </Link>
          </li>

          <li>
            <Link passHref href="/app/friends/pending">
              <a
                css={[
                  tw`text-sm font-semibold rounded text-gray-600 px-2 py-1`,
                  router.asPath === '/app/friends/pending'
                    ? tw`bg-gray-200 text-gray-800`
                    : tw`hover:bg-gray-200 hover:text-gray-700`,
                ]}
              >
                Pending
              </a>
            </Link>
          </li>

          <li>
            <Link passHref href="/app/friends/add">
              <a
                css={[
                  tw`text-sm font-semibold text-white bg-brand-500 px-2 py-1 rounded`,
                  router.asPath === '/app/friends/add' && tw`text-brand-100`,
                ]}
              >
                Add friend
              </a>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default FriendsHeader
