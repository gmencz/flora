import firebase from '@/lib/firebase/client'
import { useAuthState } from 'react-firebase-hooks/auth'

function useUser() {
  const [user] = useAuthState(firebase.auth())
  return user as firebase.User
}

export default useUser
