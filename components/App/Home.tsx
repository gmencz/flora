import withAuthenticationRequired from '@/components/Auth/withAuthenticationRequired'
import DirectMessagesSidebar from '@/components/App/DirectMessages/Sidebar'
import 'twin.macro'

function AppPage() {
  return (
    <div tw="flex">
      <DirectMessagesSidebar />
    </div>
  )
}

export default withAuthenticationRequired(AppPage)
