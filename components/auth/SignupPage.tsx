"use client"

import type React from "react"
import { useState } from "react"
import { User, Mail, Phone, Dumbbell, Lock, Loader2, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface SignupPageProps {
  onSuccess: () => void
  onSwitchToLogin: () => void
}

export function SignupPage({ onSuccess, onSwitchToLogin }: SignupPageProps) {
  const supabase = createClient()
  const [formData, setFormData] = useState({
    ownerName: "",
    email: "",
    phone: "",
    gymName: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.ownerName || !formData.email || !formData.phone || !formData.gymName || !formData.password) {
      toast.error("All fields are required")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          data: {
            owner_name: formData.ownerName,
            gym_name: formData.gymName,
            phone: formData.phone,
          },
        },
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        const { error: profileError } = await supabase.rpc("create_user_profile", {
          p_user_id: authData.user.id,
          p_owner_name: formData.ownerName,
          p_gym_name: formData.gymName,
          p_email: formData.email,
          p_phone: formData.phone,
        })

        if (profileError) {
          console.error("Profile creation error:", profileError)
          // Don't throw here - the trigger might have already created it
        }

        const { error: branchError } = await supabase.from("branches").insert([
          {
            owner_id: authData.user.id,
            name: "Main Branch",
            address: "",
            phone: formData.phone,
            is_main: true,
          },
        ])

        if (branchError) {
          console.error("Branch creation error:", branchError)
        }

        toast.success("Account created successfully!")
        onSuccess()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-4">
            <Dumbbell size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">MuscleDesk</h1>
          <p className="text-muted-foreground">Get Started with Premium Gym Management</p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-2xl border border-border p-8 shadow-lg animate-fade-in">
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Owner Name */}
            <div>
              <label className="form-label">Owner Name</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="form-input pl-12"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="owner@gymnasium.com"
                  className="form-input pl-12"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="form-label">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="form-input pl-12"
                  required
                />
              </div>
            </div>

            {/* Gym Name */}
            <div>
              <label className="form-label">Gym Name</label>
              <div className="relative">
                <Dumbbell size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  name="gymName"
                  value={formData.gymName}
                  onChange={handleChange}
                  placeholder="FitZone Gymnasium"
                  className="form-input pl-12"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input pl-12"
                  required
                />
              </div>
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-accent w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Back to Login */}
          <button
            onClick={onSwitchToLogin}
            className="w-full flex items-center justify-center gap-2 mt-6 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Back to Login</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Your data is securely stored in the cloud and synced across all devices.
        </p>
      </div>
    </div>
  )
}
