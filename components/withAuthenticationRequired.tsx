import firebase from '@/lib/firebase/client'
import { ComponentType } from 'react'
import { useRouter } from 'next/router'
import { useAuthState } from 'react-firebase-hooks/auth'

const defaultOnRedirecting = () => <></>

interface WithAuthenticationRequiredOptions {
  /**
   * ```js
   * withAuthenticationRequired(Profile, {
   *   onRedirecting: () => <div>Redirecting you to the login...</div>
   * })
   * ```
   *
   * Render a message to show that the user is being redirected to the login.
   */
  onRedirecting?: () => JSX.Element
}

const withAuthenticationRequired = <P extends object>(
  Component: ComponentType<P>,
  options: WithAuthenticationRequiredOptions = {},
) => {
  return function WithAuthenticationRequired(props: P) {
    const [user, loading, error] = useAuthState(firebase.auth())
    const { onRedirecting = defaultOnRedirecting } = options
    const router = useRouter()

    if (!loading && (!user || error)) {
      const nextPath = router.asPath
      router.push(`/login?next=${encodeURIComponent(nextPath)}`)
    }

    return user ? <Component {...props} /> : onRedirecting()
  }
}

export default withAuthenticationRequired
