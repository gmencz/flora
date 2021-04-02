import firebase from '@/lib/firebase/client'
import { ComponentType, useCallback, useContext } from 'react'
import { useRouter } from 'next/router'
import { useAuthState } from 'react-firebase-hooks/auth'
import { WebSocketContext } from '../Providers/WebSocket'
import { useMeQuery } from '@/hooks/useMeQuery'

const auth = firebase.auth()

const defaultOnAuthenticating = () => <>Authenticating...</>

interface WithAuthenticationRequiredOptions {
  /**
   * ```js
   * withAuthenticationRequired(Profile, {
   *   onAuthenticating: () => <div>Redirecting you to the login...</div>
   * })
   * ```
   *
   * Render a message to show that the user is being redirected to the login.
   */
  onAuthenticating?: () => JSX.Element
}

const withAuthenticationRequired = <P extends object>(
  Component: ComponentType<P>,
  options: WithAuthenticationRequiredOptions = {},
) => {
  return function WithAuthenticationRequired(props: P) {
    const router = useRouter()
    const [firebaseUser, loadingFirebase, firebaseError] = useAuthState(auth)
    const { onAuthenticating = defaultOnAuthenticating } = options
    const { conn } = useContext(WebSocketContext)
    const meQuery = useMeQuery()

    const redirectToLogin = useCallback(() => {
      router.push(`/login?next=${window.location.pathname}`)
    }, [router])

    const errorAuthenticating =
      (!loadingFirebase && (!firebaseUser || firebaseError)) || meQuery.isError

    if (errorAuthenticating) {
      redirectToLogin()
    }

    const success = !!firebaseUser && !!conn && meQuery.isSuccess
    return success ? <Component {...props} /> : onAuthenticating()
  }
}

export default withAuthenticationRequired
