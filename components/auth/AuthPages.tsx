"use client"

import { useState } from "react"
import { LoginPage } from "./LoginPage"
import { SignupPage } from "./SignupPage"

interface AuthPagesProps {
  onAuthenticate: () => void
}

export function AuthPages({ onAuthenticate }: AuthPagesProps) {
  const [isLogin, setIsLogin] = useState(true)

  return isLogin ? (
    <LoginPage onSuccess={onAuthenticate} onSwitchToSignup={() => setIsLogin(false)} />
  ) : (
    <SignupPage onSuccess={onAuthenticate} onSwitchToLogin={() => setIsLogin(true)} />
  )
}
