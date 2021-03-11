import Link from 'next/link'
import { Page } from '@/lib/types/common'
import Tooltip from '@/components/ui/Tooltip'
import useFaunaQuery from '@/lib/useFaunaQuery'
import serversFql from '@/fauna/queries/servers'

interface Server {
  id: string
  name: string
  photo: string
}

function ServersList() {
  const { data: servers } = useFaunaQuery<Page<Server>>({
    queryKey: 'servers',
    fql: serversFql,
    staleTime: Infinity,
  })

  return (
    <>
      {servers?.data.map(server => (
        <li key={server.id} className="relative">
          <Tooltip label={server.name} position="right">
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
