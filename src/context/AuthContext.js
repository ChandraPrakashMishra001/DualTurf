'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
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
      createdAt: new Date().toISOString(),
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      const user = credential.user
      await updateProfile(user, { displayName: fullName })
      profileData.uid = user.uid
      try {
        await setDoc(doc(db, 'users', user.uid), profileData)
      } catch (e) {}
    } catch (e) {
      console.warn('Firebase Auth register notice:', e.message)
    }

    try {
      localStorage.setItem('dualturf_current_user', JSON.stringify(profileData))
      const savedUsers = JSON.parse(localStorage.getItem('dualturf_users') || '[]')
      savedUsers.push({ ...profileData, password })
      localStorage.setItem('dualturf_users', JSON.stringify(savedUsers))
    } catch (err) {}

    setCurrentUser(profileData)
    setUserProfile(profileData)
    return profileData
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
        logout,
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
