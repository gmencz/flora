import withAuthenticationRequired from '@/components/Auth/withAuthenticationRequired'
import DMsSidebar from '@/components/App/DirectMessages/Sidebar'
import ServersSidebar from '@/components/App/Servers/Sidebar'

function AppPage() {
  return (
    <div className="flex">
      <ServersSidebar />
      <DMsSidebar />
    </div>
  )
}

export default withAuthenticationRequired(AppPage)
