import withAuthenticationRequired from '@/components/Auth/withAuthenticationRequired'
import DirectMessagesSidebar from '@/components/App/DirectMessages/Sidebar'
import ServersSidebar from '@/components/App/Servers/Sidebar'
import 'twin.macro'

function AppPage() {
  return (
    <div tw="flex">
      <ServersSidebar />
      <DirectMessagesSidebar />
    </div>
  )
}

export default withAuthenticationRequired(AppPage)
