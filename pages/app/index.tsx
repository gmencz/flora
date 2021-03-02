import ServersSidebar from '@/components/ServersSidebar'
import withAuthenticationRequired from '@/components/withAuthenticationRequired'

function AppPage() {
  return (
    <div className="flex bg-white">
      <ServersSidebar />

      <div className="w-sidebar bg-gray-100"></div>
    </div>
  )
}

export default withAuthenticationRequired(AppPage)
