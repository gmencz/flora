import DMsSidebar from '@/components/DMs/Sidebar'
import withAuthenticationRequired from '@/components/withAuthenticationRequired'

function AppPage() {
  return (
    <>
      <DMsSidebar />
    </>
  )
}

export default withAuthenticationRequired(AppPage)
