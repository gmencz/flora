import db from '@/lib/db'
import useUser from '@/lib/useUser'
import Link from 'next/link'
import { useQuery } from 'react-query'
import ServersSidebarTooltip from './ServersSidebarTooltip'

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

function ServersList() {
  const { uid } = useUser()
  const serversQuery = useQuery('servers', () => fetchServers(uid), {
    staleTime: Infinity,
  })

  return (
    <>
      {serversQuery.data?.map(server => (
        <li key={server.id} className="relative">
          <ServersSidebarTooltip label={server.name}>
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
          </ServersSidebarTooltip>
        </li>
      ))}
    </>
  )
}

export default ServersList
