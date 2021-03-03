import db from '@/lib/db'
import useUser from '@/lib/useUser'
import firebase from '@/lib/firebase'
import Link from 'next/link'
import { useQuery } from 'react-query'
import Tooltip from '../Tooltip'

interface Server {
  id: string
  name: string
  photo: string
}

interface ServerDocument {
  joinedAt: firebase.firestore.Timestamp
  serverName: string
  serverPhoto: string
}

async function fetchServers(userId: string): Promise<Server[]> {
  const serversDocuments = await db
    .collection('users')
    .doc(userId)
    .collection('servers')
    .orderBy('joinedAt', 'desc')
    .get()

  return serversDocuments.docs.map(doc => {
    const server = doc.data() as ServerDocument

    return {
      id: doc.id,
      name: server.serverName,
      photo: server.serverPhoto,
    }
  })
}

function ServersList() {
  const { uid } = useUser()
  const { data: servers } = useQuery('servers', () => fetchServers(uid), {
    staleTime: Infinity,
  })

  return (
    <>
      {servers?.map(server => (
        <li key={server.id} className="relative">
          <Tooltip label={server.name}>
            <div>
              <Link href={`/app/servers/${server.id}`}>
                <a className="flex h-12 w-12 justify-center items-center">
                  <img
                    className="rounded-2xl"
                    src={server.photo}
                    alt={server.name}
                  />
                </a>
              </Link>
            </div>
          </Tooltip>
        </li>
      ))}
    </>
  )
}

export default ServersList
