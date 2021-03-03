import ServersSidebar from '@/components/Servers/Sidebar'
import Tooltip from '@/components/Tooltip'
import withAuthenticationRequired from '@/components/withAuthenticationRequired'
import db from '@/lib/db'
import firebase from '@/lib/firebase'
import useUser from '@/lib/useUser'
import Link from 'next/link'
import { useQuery } from 'react-query'

interface DM {
  id: string
  recipient: {
    displayName: string
    photoURL: string
  }
}

interface DMDocument {
  latestMessageTimestamp: firebase.firestore.Timestamp
  recipientDisplayName: string
  recipientPhotoURL: string
  recipientUid: string
}

async function fetchDMs(userId: string): Promise<DM[]> {
  const dmsDocuments = await db
    .collection('users')
    .doc(userId)
    .collection('dms')
    .orderBy('latestMessageTimestamp', 'desc')
    .get()

  return dmsDocuments.docs.map(doc => {
    const dm = doc.data() as DMDocument

    return {
      id: doc.id,
      recipient: {
        displayName: dm.recipientDisplayName,
        photoURL: dm.recipientPhotoURL,
      },
    }
  })
}

function AppPage() {
  const { uid } = useUser()
  const { displayName, photoURL, email } = useUser()
  const { data: dms } = useQuery('dms', () => fetchDMs(uid), {
    staleTime: Infinity,
  })

  return (
    <div className="flex">
      <ServersSidebar />

      <div className="flex flex-col w-sidebar min-h-screen max-h-screen bg-gray-200">
        {/* Direct messages */}
        <div className="p-3">
          <div>
            <Link href="/app/friends">
              <a className="text-gray-600 flex space-x-3 px-2 py-2 items-center hover:bg-gray-300 rounded hover:text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>

                <span className="text-sm font-medium">Friends</span>
              </a>
            </Link>
          </div>

          <div className="mt-4 z-10 space-y-1.5">
            <div className="flex px-2 items-center justify-between">
              <h2 className="uppercase text-tiny font-semibold text-gray-600">
                Direct messages
              </h2>

              <div className="relative">
                <Tooltip label="Create DM" onTop>
                  <Link href="/app/dms/new">
                    <a>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5 text-gray-500"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                  </Link>
                </Tooltip>
              </div>
            </div>

            <ul className="space-y-1">
              {dms?.map(dm => (
                <li key={dm.id}>
                  <Link href={`/app/dms/${dm.id}`}>
                    <a className="text-gray-600 flex space-x-3 px-1.5 py-1 items-center hover:bg-gray-300 rounded hover:text-gray-700">
                      <img
                        src={dm.recipient.photoURL}
                        alt={dm.recipient.displayName}
                        className="w-8 h-8 rounded-full"
                      />

                      <span className="text-sm font-medium">
                        {dm.recipient.displayName}
                      </span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Profile */}
        <div className="mt-auto p-3 bg-gray-300">
          <div className="flex">
            <div className="flex items-center">
              <img
                className="h-9 w-9 object-cover rounded-full"
                src={photoURL!}
                alt={displayName!}
              />

              <div className="ml-3 flex flex-col">
                <span className="text-sm font-semibold">{displayName}</span>
                <span className="text-xs text-gray-700 break-all">{email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-gray-100 flex-1"></div>
    </div>
  )
}

export default withAuthenticationRequired(AppPage)
