import db from '@/lib/db'
import useUser from '@/lib/useUser'
import Link from 'next/link'
import { useQuery } from 'react-query'
import ServersSidebarTooltip from './SidebarTooltip'

interface Server {
  id: string
  name: string
  photo: string
}

async function fetchServers(userId: string): Promise<Server[]> {
  const serversRef = await db
    .collection('servers')
    .where('members', 'in', [userId])
    .get()

  serversRef.forEach(s => {
    console.log(s.data())
  })

  return []
  // return snapshot.docs.map(doc => {
  //   const server = doc.data()
  //   console.log({ server })

  //   return {
  //     id: doc.id,
  //     name: server.name,
  //     photo: server.photo,
  //   }
  // })
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
