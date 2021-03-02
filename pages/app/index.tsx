import withAuthenticationRequired from '@/components/withAuthenticationRequired'
import db from '@/lib/db'
import useUser from '@/lib/useUser'
import Link from 'next/link'
import { useQuery } from 'react-query'
import SidebarTooltip from '@/components/SidebarTooltip'

interface Server {
  id: string
  name: string
  photo: string
}

async function fetchServers(userId: string): Promise<Server[]> {
  const snapshot = await db
    .collection('servers')
    .where('users', 'array-contains', db.collection('users').doc(userId))
    .get()

  return snapshot.docs.map(doc => {
    const server = doc.data()
    return {
      id: doc.id,
      name: server.name,
      photo: server.photo,
    }
  })
}

function AppPage() {
  const { uid } = useUser()
  const serversQuery = useQuery('servers', () => fetchServers(uid), {
    staleTime: Infinity,
  })

  return (
    <div className="flex bg-gray-100">
      {/* Desktop servers sidebar */}
      <aside className="flex flex-col py-4 w-sidebar bg-gray-200 min-h-screen max-h-screen space-y-3">
        <ul className="flex justify-center">
          <li className="relative">
            <SidebarTooltip label="Home">
              <Link href="/app">
                <a className="flex h-12 w-12 justify-center items-center bg-white p-2 rounded-2xl group-hover:bg-brand-500 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-full text-gray-800 group-hover:text-white"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  <span className="sr-only">Home</span>
                </a>
              </Link>
            </SidebarTooltip>
          </li>
        </ul>

        {/* Divider */}
        <div className="h-0.5 w-1/3 bg-gray-300 self-center" />

        <nav>
          {/* Servers list */}
          <ul className="flex flex-col items-center space-y-2">
            {serversQuery.data?.map(server => (
              <li key={server.id} className="relative">
                <SidebarTooltip label={server.name}>
                  <div>
                    <Link href={`/servers/${server.id}`}>
                      <a className="flex h-12 w-12 justify-center items-center">
                        <img
                          className="rounded-2xl"
                          src={server.photo}
                          alt={server.name}
                        />
                      </a>
                    </Link>
                  </div>
                </SidebarTooltip>
              </li>
            ))}

            <li className="relative">
              <SidebarTooltip label="Add a Server">
                <div className="group">
                  <Link href="/servers/new">
                    <a className="flex h-12 w-12 justify-center items-center bg-white p-2 rounded-2xl group-hover:bg-brand-500 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-full text-gray-800 group-hover:text-white"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>

                      <span className="sr-only">Add a Server</span>
                    </a>
                  </Link>
                </div>
              </SidebarTooltip>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  )
}

export default withAuthenticationRequired(AppPage)
