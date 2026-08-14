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
} from 'firebase/auth'
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [userOrders, setUserOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Load saved session on init
  useEffect(() => {
    try {
      const localCurrent = localStorage.getItem('dualturf_current_user')
      if (localCurrent) {
        const parsed = JSON.parse(localCurrent)
        setCurrentUser(parsed)
        setUserProfile(parsed)
        setLoading(false) // Immediately unblock UI if local session exists
      }
    } catch (e) {
      console.warn('LocalStorage session read error:', e)
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user)
          try {
            const userDocRef = doc(db, 'users', user.uid)
            const userSnap = await getDoc(userDocRef)
            if (userSnap.exists()) {
              setUserProfile(userSnap.data())
            } else {
              setUserProfile({
                uid: user.uid,
                name: user.displayName || user.email,
                email: user.email,
                emailVerified: user.emailVerified,
              })
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
    const fullName = `${firstName} ${lastName}`
    const profileData = {
      uid: `user_${Date.now()}`,
      firstName,
      lastName,
      name: fullName,
      email: email.toLowerCase(),
      emailVerified: false,
      createdAt: new Date().toISOString(),
    }

    let user = null
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      user = credential.user
      await updateProfile(user, { displayName: fullName })
      try {
        await sendEmailVerification(user)
      } catch (e) {
        console.warn('Email verification send notice:', e.message)
      }
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
      console.warn('Firebase Auth register warning (using fallback session):', e.message)
    }

    // Save session locally
    try {
      localStorage.setItem('dualturf_current_user', JSON.stringify(profileData))
      const savedUsers = JSON.parse(localStorage.getItem('dualturf_users') || '[]')
      const existingIdx = savedUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase())
      if (existingIdx > -1) {
        savedUsers[existingIdx] = { ...profileData, password }
      } else {
        savedUsers.push({ ...profileData, password })
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
    let user = null
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      user = credential.user
    } catch (e) {
      console.warn('Firebase Auth login notice:', e.message)
    }

    if (!user) {
      try {
        const savedUsers = JSON.parse(localStorage.getItem('dualturf_users') || '[]')
        const found = savedUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
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
      name: user.name || user.displayName || user.email,
      email: user.email,
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
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    const profileData = {
      uid: user.uid,
      name: user.displayName || user.email,
      email: user.email,
      emailVerified: true, // Google accounts are pre-verified by Google
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
