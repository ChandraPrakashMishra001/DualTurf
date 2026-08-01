'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [userOrders, setUserOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        // Fetch user profile from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userSnap = await getDoc(userDocRef)
          if (userSnap.exists()) {
            setUserProfile(userSnap.data())
          } else {
            setUserProfile({
              uid: user.uid,
              name: user.displayName || 'Customer',
              email: user.email,
            })
          }

          // Fetch user order history from Firestore
          fetchUserOrders(user.uid)
        } catch (e) {
          console.warn('Firestore fetch error (using fallback local state):', e)
        }
      } else {
        setUserProfile(null)
        setUserOrders([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
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
      console.warn('Failed to fetch user order history from Firestore:', e)
    }
  }

  const register = async (firstName, lastName, email, password) => {
    const fullName = `${firstName} ${lastName}`
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const user = credential.user

    await updateProfile(user, { displayName: fullName })

    const profileData = {
      uid: user.uid,
      firstName,
      lastName,
      name: fullName,
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
    }

    try {
      // Store user profile permanently in Firestore
      await setDoc(doc(db, 'users', user.uid), profileData)
    } catch (e) {
      console.warn('Firestore setDoc error:', e)
    }

    setUserProfile(profileData)
    return user
  }

  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
  }

  const logout = async () => {
    await signOut(auth)
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
