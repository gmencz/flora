import DMsSidebar from '@/components/DMs/Sidebar'
import ServersSidebar from '@/components/Servers/Sidebar'
import withAuthenticationRequired from '@/components/withAuthenticationRequired'
import { useRouter } from 'next/router'
import { useQuery } from 'react-query'

function DM() {
  const router = useRouter()
  const { channel, dm } = router.query as Record<string, string>

  const dmQuery = useQuery(['dm', dm], async () => {}, { staleTime: Infinity })

  return (
    <div className="flex">
      <ServersSidebar />

      <DMsSidebar />

      <div className="flex-1">
        <header className="py-4 sticky top-0 px-6 bg-gray-100 shadow-sm">
          <div className="flex space-x-2.5 items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
            {/* <span className="text-sm font-semibold text-gray-900">
              {dmQuery.data?.withUser.name}
            </span> */}
          </div>
        </header>
        <section className="px-6 py-4" style={{ minHeight: '200vh' }}>
          {channel}
        </section>
      </div>
    </div>
  )
}

export default withAuthenticationRequired(DM)
