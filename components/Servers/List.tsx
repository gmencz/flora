import { useQuery } from 'react-query'
import useFauna from '@/lib/useFauna'
import {
  CurrentIdentity,
  Get,
  Index,
  Lambda,
  Let,
  Map,
  Match,
  Paginate,
  Select,
  Var,
} from 'faunadb'
import { Page } from '@/lib/types'
import resolvePagination from '@/util/resolvePagination'
import Tooltip from '../Tooltip'
import Link from 'next/link'

interface Server {
  id: string
  name: string
  photo: string
}

function ServersList() {
  const fauna = useFauna()
  const { data: servers } = useQuery(
    'servers',
    async () => {
      const paginatedServers = await fauna!.query<Page<Server>>(
        Let(
          {
            paginationResult: Map(
              Paginate(Match(Index('server_users_by_user'), CurrentIdentity())),
              Lambda(
                'ref',
                Let(
                  {
                    serverDoc: Get(
                      Select(['data', 'serverRef'], Get(Var('ref'))),
                    ),
                  },
                  {
                    id: Select(['ref', 'id'], Var('serverDoc')),
                    name: Select(['data', 'name'], Var('serverDoc')),
                    photo: Select(['data', 'photo'], Var('serverDoc')),
                  },
                ),
              ),
            ),
          },
          resolvePagination(Var('paginationResult')),
        ),
      )

      return paginatedServers
    },
    {
      staleTime: Infinity,
      enabled: !!fauna,
    },
  )

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
