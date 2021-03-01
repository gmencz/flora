import withAuthenticationRequired from '@/components/withAuthenticationRequired'
import useUser from '@/lib/useUser'

function AppPage() {
  const user = useUser()
  return (
    <div>
      <h1>
        Hello {user.displayName}{' '}
        <span aria-label="man waving" role="img">
          🙋‍♂️
        </span>
      </h1>
    </div>
  )
}

export default withAuthenticationRequired(AppPage)
