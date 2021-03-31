import firebase from '@/lib/firebase/client'
import { useAuthState } from 'react-firebase-hooks/auth'

function useFirebaseUser() {
  const [user] = useAuthState(firebase.auth())
  return user as firebase.User
}

export default useFirebaseUser
