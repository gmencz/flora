import useUser from '@/lib/useUser'
import Link from 'next/link'
import { useQuery } from 'react-query'
import Tooltip from '../Tooltip'

// async function fetchServers() {
//   return []
// }

function ServersList() {
  // const { uid } = useUser()
  // const { data: servers } = useQuery('servers', () => fetchServers(uid), {
  //   staleTime: Infinity,
  // })

  return (
    <>
      {/* {servers?.map(server => (
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
      ))} */}
    </>
  )
}

export default ServersList
