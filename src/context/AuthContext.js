'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])

  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('dualturf_users')
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers))
      }
      const savedCurrent = localStorage.getItem('dualturf_current_user')
      if (savedCurrent) {
        setCurrentUser(JSON.parse(savedCurrent))
      }
    } catch (e) {
      console.error('Failed to load user session:', e)
    }
  }, [])

  const register = (firstName, lastName, email, password) => {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existing) {
      throw new Error('An account with this email address already exists. Please login.')
    }

    const newUser = {
      id: `user_${Date.now()}`,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      password,
      createdAt: new Date().toISOString(),
    }

    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    setCurrentUser(newUser)

    try {
      localStorage.setItem('dualturf_users', JSON.stringify(updatedUsers))
      localStorage.setItem('dualturf_current_user', JSON.stringify(newUser))
    } catch (e) {
      console.error('Failed to save user session:', e)
    }

    return newUser
  }

  const login = (email, password) => {
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )

    if (!user) {
      throw new Error('Invalid email or password. Please check your credentials.')
    }

    setCurrentUser(user)
    try {
      localStorage.setItem('dualturf_current_user', JSON.stringify(user))
    } catch (e) {
      console.error('Failed to save login session:', e)
    }

    return user
  }

  const logout = () => {
    setCurrentUser(null)
    try {
      localStorage.removeItem('dualturf_current_user')
    } catch (e) {
      console.error('Failed to clear user session:', e)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        register,
        login,
        logout,
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
