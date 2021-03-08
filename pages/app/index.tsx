import DMsSidebar from '@/components/DMs/Sidebar'
import ServersSidebar from '@/components/Servers/Sidebar'
import withAuthenticationRequired from '@/components/withAuthenticationRequired'

function AppPage() {
  return (
    <div className="flex">
      <ServersSidebar />

      <DMsSidebar />
    </div>
  )
}

export default withAuthenticationRequired(AppPage)
