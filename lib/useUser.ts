import firebase from '@/lib/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'

interface User extends Record<string, unknown> {
  uid: string
  displayName: string
  photoURL: string
  email: string
}

function useUser() {
  const [user] = useAuthState(firebase.auth())
  return user as User
}

export default useUser
