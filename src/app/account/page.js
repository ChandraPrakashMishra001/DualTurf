'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function AccountIndexPage() {
  const { currentUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        router.replace('/account/orders')
      } else {
        router.replace('/account/login')
      }
    }
  }, [currentUser, loading, router])

  return (
    <div className="container" style={{ paddingTop: '140px', paddingBottom: '100px', textAlign: 'center', color: '#888' }}>
      <p>Loading your account...</p>
    </div>
  )
}
