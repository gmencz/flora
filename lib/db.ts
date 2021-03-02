import firebase from '@/lib/firebase'

const db = firebase.firestore()

if (process.env.NODE_ENV !== 'production') {
  db.useEmulator('localhost', 8080)
}

export default db
