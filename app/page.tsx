"use client"

import { useState, useEffect } from "react"
import { AuthPages } from "@/components/auth/AuthPages"
import { MainLayout } from "@/components/layout/MainLayout"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)

    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        setIsAuthenticated(!!user)
      } catch (error) {
        console.error("Authentication error:", error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? (
    <MainLayout onLogout={() => setIsAuthenticated(false)} />
  ) : (
    <AuthPages onAuthenticate={() => setIsAuthenticated(true)} />
  )
}
