import firebase from '@/lib/firebase/client'
import { ComponentType, useCallback, useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthState } from 'react-firebase-hooks/auth'
import { WebSocketContext } from '../Providers/WebSocket'
import { json } from '@/util/json'

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
    const [user, loading, error] = useAuthState(auth)
    const { onAuthenticating = defaultOnAuthenticating } = options
    const router = useRouter()
    const { conn } = useContext(WebSocketContext)

    const redirectToLogin = useCallback(() => {
      json('/api/auth/logout', { method: 'POST' }).finally(() => {
        router.push(`/login?next=${window.location.pathname}`)
      })
    }, [router])

    useEffect(() => {}, [])

    const errorAuthenticating = !loading && (!user || error)
    if (errorAuthenticating) {
      redirectToLogin()
    }

    const success = !!user && !!conn
    return success ? <Component {...props} /> : onAuthenticating()
  }
}

export default withAuthenticationRequired
