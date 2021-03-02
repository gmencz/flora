// Firebase App (the core Firebase SDK) is always required and must be listed first
import firebase from 'firebase/app'
// If you are using v7 or any earlier version of the JS SDK, you should import firebase using namespace import
// import * as firebase from "firebase/app"

// If you enabled Analytics in your project, add the Firebase SDK for Analytics
import 'firebase/analytics'

// Add the Firebase products that you want to use
import 'firebase/auth'
import 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBG0y5UgN5PBuhXTzGJ1G-p8aGzVNIryjs',
  authDomain: 'chatskee-ca7cf.firebaseapp.com',
  projectId: 'chatskee-ca7cf',
  storageBucket: 'chatskee-ca7cf.appspot.com',
  messagingSenderId: '215273238907',
  appId: '1:215273238907:web:da580d5e8714f676100dde',
  measurementId: 'G-K6JMLT0J1Y',
}

if (!firebase.apps.length) {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig)

  if (process.env.NODE_ENV !== 'production') {
    const auth = firebase.auth()
    auth.useEmulator('http://localhost:9099')
  }
}

export default firebase
