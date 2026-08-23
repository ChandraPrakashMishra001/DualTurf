import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBs3uvPOGFu6kXDit36_5T-kuUheV4I-HI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dual-turf.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dual-turf",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dual-turf.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "837439162049",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:837439162049:web:6047e46f07b4b264067640",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-5ZZDEKP34S"
}

// Initialize Firebase App (prevent duplicate initialization)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

let authInstance
try {
  if (typeof window !== 'undefined') {
    authInstance = initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
    })
  } else {
    authInstance = getAuth(app)
  }
} catch (e) {
  authInstance = getAuth(app)
}

export const auth = authInstance
export const db = getFirestore(app)
export default app

