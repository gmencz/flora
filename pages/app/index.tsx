import ServersSidebar from '@/components/Servers/Sidebar'
import withAuthenticationRequired from '@/components/withAuthenticationRequired'
import useUser from '@/lib/useUser'

function AppPage() {
  const { displayName, photoURL, email } = useUser()

  return (
    <div className="flex bg-white">
      <ServersSidebar />

      <div className="flex overflow-hidden flex-col w-sidebar min-h-screen max-h-screen bg-gray-50">
        {/* Direct messages */}
        <div className="overflow-auto">
          <span>Hi</span>
        </div>

        {/* Profile */}
        <div className="mt-auto p-3 bg-gray-100">
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
    </div>
  )
}

export default withAuthenticationRequired(AppPage)
