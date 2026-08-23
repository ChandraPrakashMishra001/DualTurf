'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth'
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [userOrders, setUserOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Load saved session on init & handle mobile redirect result
  useEffect(() => {
    try {
      const localCurrent = localStorage.getItem('dualturf_current_user')
      if (localCurrent) {
        const parsed = JSON.parse(localCurrent)
        setCurrentUser(parsed)
        setUserProfile(parsed)
        setLoading(false)
      }
    } catch (e) {
      console.warn('LocalStorage session read error:', e)
    }

    // Check for Google redirect result (for mobile phones)
    try {
      getRedirectResult(auth)
        .then(async (result) => {
          if (result && result.user) {
            const user = result.user
            const profileData = {
              uid: user.uid,
              name: user.displayName || user.email,
              email: user.email,
              emailVerified: true,
              photoURL: user.photoURL,
              createdAt: new Date().toISOString(),
            }
            try {
              localStorage.setItem('dualturf_current_user', JSON.stringify(profileData))
            } catch (err) {}
            setCurrentUser(profileData)
            setUserProfile(profileData)
          }
        })
        .catch((err) => {
          console.warn('Redirect auth notice:', err)
        })
    } catch (err) {}

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const sessionUser = {
            uid: user.uid,
            name: user.displayName || user.email,
            email: user.email,
            emailVerified: user.emailVerified,
            photoURL: user.photoURL,
          }
          setCurrentUser(sessionUser)
          try {
            const userDocRef = doc(db, 'users', user.uid)
            const userSnap = await getDoc(userDocRef)
            if (userSnap.exists()) {
              setUserProfile(userSnap.data())
            } else {
              setUserProfile(sessionUser)
            }
            fetchUserOrders(user.uid)
          } catch (e) {
            console.warn('Firestore fetch fallback:', e)
          }
        }
        setLoading(false)
      })
      return () => unsubscribe()
    } catch (e) {
      console.warn('Firebase init fallback:', e)
      setLoading(false)
    }
  }, [])

  const fetchUserOrders = async (uid) => {
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', uid))
      const querySnapshot = await getDocs(q)
      const orders = []
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() })
      })
      setUserOrders(orders)
    } catch (e) {
      console.warn('Failed to fetch user orders:', e)
    }
  }

  const register = async (firstName, lastName, email, password) => {
    const cleanFirstName = (firstName || '').trim()
    const cleanLastName = (lastName || '').trim()
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanPassword = (password || '').trim()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.')
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      throw new Error('Password should be at least 6 characters long.')
    }

    const fullName = `${cleanFirstName} ${cleanLastName}`.trim() || cleanEmail.split('@')[0]
    const profileData = {
      uid: `user_${Date.now()}`,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      name: fullName,
      email: cleanEmail,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    }

    let user = null
    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword)
      user = credential.user
      await updateProfile(user, { displayName: fullName })
      try {
        await sendEmailVerification(user)
      } catch (e) {}
      profileData.uid = user.uid
      profileData.emailVerified = user.emailVerified
      try {
        await setDoc(doc(db, 'users', user.uid), profileData)
      } catch (e) {}
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please Sign In.')
      } else if (e.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.')
      } else if (e.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.')
      }
      console.warn('Firebase Auth register notice (using local session fallback):', e.message)
    }

    // Save session locally with maximum safety
    try {
      localStorage.setItem('dualturf_current_user', JSON.stringify(profileData))
      const savedUsers = JSON.parse(localStorage.getItem('dualturf_users') || '[]')
      const existingIdx = savedUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail)
      if (existingIdx > -1) {
        savedUsers[existingIdx] = { ...profileData, password: cleanPassword }
      } else {
        savedUsers.push({ ...profileData, password: cleanPassword })
      }
      localStorage.setItem('dualturf_users', JSON.stringify(savedUsers))
    } catch (err) {}

    setCurrentUser(profileData)
    setUserProfile(profileData)
    return profileData
  }

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser)
      return true
    }
    return false
  }

  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanPassword = (password || '').trim()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.')
    }
    if (!cleanPassword) {
      throw new Error('Please enter your password.')
    }

    let user = null
    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword)
      user = credential.user
    } catch (e) {
      console.warn('Firebase Auth login notice:', e.message)
    }

    if (!user) {
      try {
        const savedUsers = JSON.parse(localStorage.getItem('dualturf_users') || '[]')
        const found = savedUsers.find(
          (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
        )
        if (found) {
          user = found
        }
      } catch (err) {}
    }

    if (!user) {
      throw new Error('Invalid email or password. Please check your credentials.')
    }

    const sessionObj = {
      uid: user.uid || user.id || `user_${Date.now()}`,
      name: user.name || user.displayName || user.email.split('@')[0],
      email: cleanEmail,
      emailVerified: user.emailVerified || false,
      createdAt: user.createdAt || new Date().toISOString(),
    }

    try {
      localStorage.setItem('dualturf_current_user', JSON.stringify(sessionObj))
    } catch (e) {}

    setCurrentUser(sessionObj)
    setUserProfile(sessionObj)
    return sessionObj
  }

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    let user = null
    try {
      const result = await signInWithPopup(auth, provider)
      user = result.user
    } catch (popupErr) {
      console.warn('Popup sign in failed on phone browser:', popupErr.code, popupErr.message)
      
      // On mobile browsers where popups are blocked by default:
      if (
        popupErr.code === 'auth/popup-blocked' ||
        popupErr.code === 'auth/cancelled-popup-request' ||
        popupErr.code === 'auth/popup-closed-by-user'
      ) {
        try {
          await signInWithRedirect(auth, provider)
          return
        } catch (redirectErr) {
          console.warn('Redirect auth error:', redirectErr)
        }
      }

      // Provide user-friendly message
      if (popupErr.code === 'auth/popup-blocked') {
        throw new Error('Google sign-in popup was blocked by your browser. Please allow popups or use email sign-in.')
      } else if (popupErr.code === 'auth/unauthorized-domain') {
        throw new Error('Please sign in with your email and password.')
      } else if (popupErr.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is currently unavailable. Please use Email & Password to sign in.')
      }
      throw popupErr
    }

    if (!user) return null

    const profileData = {
      uid: user.uid,
      name: user.displayName || user.email,
      email: user.email.toLowerCase(),
      emailVerified: true,
      photoURL: user.photoURL,
      createdAt: new Date().toISOString(),
    }

    try {
      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true })
    } catch (e) {}

    try {
      localStorage.setItem('dualturf_current_user', JSON.stringify(profileData))
    } catch (e) {}

    setCurrentUser(profileData)
    setUserProfile(profileData)
    return profileData
  }

  const updateSavedAddress = async (addressData) => {
    if (!currentUser) return
    const updatedProfile = {
      ...userProfile,
      savedAddress: addressData,
    }

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), { savedAddress: addressData }, { merge: true })
      } catch (e) {
        console.warn('Firestore address update warning:', e)
      }
    }

    try {
      localStorage.setItem('dualturf_current_user', JSON.stringify(updatedProfile))
      const savedUsers = JSON.parse(localStorage.getItem('dualturf_users') || '[]')
      const existingIdx = savedUsers.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase())
      if (existingIdx > -1) {
        savedUsers[existingIdx].savedAddress = addressData
        localStorage.setItem('dualturf_users', JSON.stringify(savedUsers))
      }
    } catch (err) {}

    setUserProfile(updatedProfile)
    setCurrentUser(updatedProfile)
    return updatedProfile
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (e) {}
    try {
      localStorage.removeItem('dualturf_current_user')
    } catch (e) {}
    setCurrentUser(null)
    setUserProfile(null)
    setUserOrders([])
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        userOrders,
        loading,
        register,
        login,
        loginWithGoogle,
        resendVerification,
        logout,
        updateSavedAddress,
        fetchUserOrders: () => currentUser && fetchUserOrders(currentUser.uid),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
