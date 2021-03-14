import getDirectMessageFql from '@/fauna/queries/directMessage'
import { DirectMessageDetails } from '@/lib/types/messages'
import useFaunaQuery from '@/lib/useFaunaQuery'
import { ChannelComponentProps } from '.'
import 'twin.macro'

function ChannelHeader({ channel, dm }: ChannelComponentProps) {
  const { data } = useFaunaQuery<DirectMessageDetails>({
    queryKey: ['dm', dm],
    fql: getDirectMessageFql(dm, channel),
    staleTime: Infinity,
  })

  return (
    <header tw="p-4 sticky top-0 px-6 bg-gray-100 shadow-sm">
      <div tw="flex space-x-2.5 items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          tw="h-6 w-6 text-gray-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
        </svg>
        <span tw="text-sm font-bold text-gray-900">{data?.withUser.name}</span>
      </div>
    </header>
  )
}

export default ChannelHeader
