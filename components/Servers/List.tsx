import { Page } from '@/lib/types'
import Link from 'next/link'
import { Server } from 'pages/api/servers'
import { useQuery } from 'react-query'
import Tooltip from '../Tooltip'

async function fetchServers(): Promise<Page<Server>> {
  const response = await fetch('/api/servers', {
    credentials: 'include',
  })

  const servers = await response.json()
  return servers
}

function ServersList() {
  const { data: servers } = useQuery('servers', fetchServers, {
    staleTime: Infinity,
  })

  return (
    <>
      {servers?.data.map(server => (
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
