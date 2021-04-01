import firebase from '@/lib/firebase/client'
import { ComponentType, useCallback, useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthState } from 'react-firebase-hooks/auth'
import { WebSocketContext } from '../Providers/WebSocket'
import { json } from '@/util/json'
import { useUserStore } from '@/hooks/useUserStore'
import shallow from 'zustand/shallow'
import { User } from '@/fauna/auth/login'

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
    const { user, setUser } = useUserStore(
      state => ({ user: state.user, setUser: state.setUser }),
      shallow,
    )

    const redirectToLogin = useCallback(() => {
      router.push(`/login?next=${window.location.pathname}`)
    }, [router])

    useEffect(() => {
      if (!user) {
        json<User>('/api/auth/me')
          .then(me => {
            setUser(me)
          })
          .catch(error => {
            console.error(error)
            redirectToLogin()
          })
      }
    }, [redirectToLogin, setUser, user])

    const errorAuthenticating =
      !loadingFirebase && (!firebaseUser || firebaseError)
    if (errorAuthenticating) {
      redirectToLogin()
    }

    const success = !!firebaseUser && !!conn && !!user
    return success ? <Component {...props} /> : onAuthenticating()
  }
}

export default withAuthenticationRequired
