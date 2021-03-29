import useUser from '@/hooks/useUser'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Tooltip } from '../../ui/Tooltip'
import tw from 'twin.macro'
import { useDirectMessagesQuery } from '@/hooks/useDirectMessagesQuery'

export default function DirectMesssagesSidebar() {
  const router = useRouter()
  const { dm: activeDm } = router.query as Record<string, string | undefined>
  const { displayName, photoURL, email } = useUser()
  const { data: dms } = useDirectMessagesQuery()

  return (
    <div tw="flex sticky z-10 top-0 flex-col w-sidebar min-h-screen max-h-screen bg-gray-200">
      <div tw="p-3">
        <div>
          <Link passHref href="/app">
            <a
              css={[
                tw`text-gray-600 flex space-x-3 px-2 py-2.5 items-center rounded`,
                router.asPath === '/app' ||
                router.asPath === '/app/friends/pending' ||
                router.asPath === '/app/friends/add'
                  ? tw`text-gray-900 bg-gray-400 bg-opacity-50`
                  : tw`hover:bg-gray-300 hover:text-gray-700`,
              ]}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                tw="w-6 h-6"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>

              <span tw="text-sm font-medium">Friends</span>
            </a>
          </Link>
        </div>

        <div tw="mt-4 z-10 space-y-2">
          <div tw="flex px-2 items-center justify-between">
            <h2 tw="uppercase text-tiny font-semibold text-gray-600">
              Direct messages
            </h2>

            <div tw="relative">
              <Tooltip label="Create DM" position="top">
                <Link passHref href="/app">
                  <a>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      tw="w-5 h-5 text-gray-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </Link>
              </Tooltip>
            </div>
          </div>

          <ul tw="space-y-1">
            {dms?.data.map(dm => (
              <li key={dm.id}>
                <Link passHref href={`/app/dms/${dm.id}/${dm.channelId}`}>
                  <a
                    css={[
                      tw`flex space-x-3 p-1.5 items-center rounded`,

                      activeDm === dm.id
                        ? tw`text-gray-900 bg-gray-400 bg-opacity-50`
                        : tw`text-gray-600 hover:bg-gray-300 hover:text-gray-700`,
                    ]}
                  >
                    <img
                      src={dm.withUser.photo}
                      alt={dm.withUser.name}
                      tw="w-8 h-8 rounded-full"
                    />

                    <span tw="text-sm font-medium">{dm.withUser.name}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Profile */}
      <div tw="mt-auto p-3 bg-gray-300">
        <div tw="flex">
          <div tw="flex items-center">
            <img
              tw="h-9 w-9 object-cover rounded-full"
              src={photoURL!}
              alt={displayName!}
            />

            <div tw="ml-3 flex flex-col">
              <span tw="text-sm font-semibold">{displayName}</span>
              <span tw="text-xs text-gray-700 break-all">{email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
