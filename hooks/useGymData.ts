"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"

export interface UserData {
  id: string
  ownerName: string
  email: string
  phone: string
  gymName: string
  role: "owner" | "manager" | "trainer" | "front_desk"
}

export interface Member {
  id: string
  name: string
  email: string
  phone: string
  plan_duration: number
  joining_date: string
  expiry_date: string
  status: "active" | "expiring" | "expired"
  branch_id?: string
  user_id?: string
  created_at?: string
  updated_at?: string
}

export interface Payment {
  id: string
  member_id: string
  member_name?: string
  amount: number
  payment_date?: string
  payment_method: string
  status?: "completed" | "pending" | "failed"
  plan_name?: string
  branch_id?: string
  user_id?: string
  created_at?: string
}

export interface Plan {
  id: string
  name: string
  price: number
  duration: number
  features: string[]
  user_id?: string
  branch_id?: string
  created_at?: string
  updated_at?: string
}

export interface ActivityLog {
  id: string
  activity_type: string
  description: string
  created_at: string
  user_id?: string
  branch_id?: string
  metadata?: any
}

export interface Branch {
  id: string
  owner_id: string
  name: string
  address: string
  phone: string
  is_main: boolean
  created_at: string
  updated_at?: string
}

export interface StaffMember {
  id: string
  user_id: string
  branch_id: string
  name: string
  email: string
  phone: string
  role: "owner" | "manager" | "trainer" | "front_desk"
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Reminder {
  id: string
  member_name: string
  daysLeft: number
  plan: string
  status: string
}

const calculateMemberStatus = (expiryDate: string): "active" | "expiring" | "expired" => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return "expired"
  if (daysLeft <= 7) return "expiring"
  return "active"
}

const calculateReminders = (members: Member[]): Reminder[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return members
    .filter((member) => {
      const expiryDate = new Date(member.expiry_date)
      expiryDate.setHours(0, 0, 0, 0)
      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysLeft > 0 && daysLeft <= 7
    })
    .map((member) => {
      const expiryDate = new Date(member.expiry_date)
      expiryDate.setHours(0, 0, 0, 0)
      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: member.id,
        member_name: member.name,
        daysLeft,
        plan: `${member.plan_duration} month${member.plan_duration > 1 ? "s" : ""}`,
        status: "pending",
      }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
}

export function useGymData() {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setAuthUser(session.user)
      }
      setLoading(false)
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetcher = useCallback(
    async (userId: string) => {
      const [profileResult, branchesResult, membersResult, paymentsResult, plansResult, staffResult] =
        await Promise.all([
          supabase.rpc("get_user_profile", { p_user_id: userId }),
          supabase.rpc("get_branches", { p_user_id: userId }),
          supabase.rpc("get_members", { p_user_id: userId }),
          supabase.rpc("get_payments", { p_user_id: userId }),
          supabase.rpc("get_plans", { p_user_id: userId }),
          supabase.rpc("get_staff", { p_user_id: userId }),
        ])

      const profile = profileResult.data
      const branches = branchesResult.data || []
      const members = membersResult.data || []
      const payments = paymentsResult.data || []
      const plans = plansResult.data || []
      const staff = staffResult.data || []

      const membersWithStatus = (members || []).map((member: Member) => ({
        ...member,
        status: calculateMemberStatus(member.expiry_date),
      }))

      const currentBranch = branches?.[0] || null
      const reminders = calculateReminders(membersWithStatus)

      const userData: UserData = {
        id: userId,
        ownerName: profile?.owner_name || authUser?.user_metadata?.name || authUser?.email?.split("@")[0] || "User",
        email: profile?.email || authUser?.email || "",
        phone: profile?.phone || "",
        gymName: profile?.gym_name || "My Gym",
        role: profile?.role || "owner",
      }

      return {
        user: userData,
        branches: branches || [],
        currentBranch,
        staff: staff || [],
        members: membersWithStatus,
        payments: payments || [],
        plans: plans || [],
        activityLog: [],
        reminders,
      }
    },
    [authUser],
  )

  const { data, error, isLoading } = useSWR(
    authUser?.id ? `gym-data-${authUser.id}` : null,
    () => fetcher(authUser!.id),
    {
      revalidateOnFocus: true, // Refresh when switching between tabs/devices
      revalidateOnReconnect: true, // Refresh when coming back online
      dedupingInterval: 5000, // Reduced for faster multi-device updates
      keepPreviousData: true, // Show stale data while fetching
      refreshInterval: 0, // Rely on realtime instead of polling
      revalidateIfStale: true, // Always check for updates
    },
  )

  useEffect(() => {
    if (!authUser?.id || channelRef.current) return

    // Create a unique channel per user for multi-device sync
    const channel = supabase
      .channel(`user-${authUser.id}`, {
        config: {
          broadcast: { self: true }, // Receive own changes for multi-tab sync
          presence: { key: authUser.id }, // Track device presence
        },
      })
      // Members table changes
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members", filter: `user_id=eq.${authUser.id}` },
        (payload) => {
          console.log("[v0] Multi-device sync: members changed", payload)
          mutate(`gym-data-${authUser.id}`)
        },
      )
      // Payments table changes
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${authUser.id}` },
        (payload) => {
          console.log("[v0] Multi-device sync: payments changed", payload)
          mutate(`gym-data-${authUser.id}`)
        },
      )
      // Plans table changes
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plans", filter: `user_id=eq.${authUser.id}` },
        (payload) => {
          console.log("[v0] Multi-device sync: plans changed", payload)
          mutate(`gym-data-${authUser.id}`)
        },
      )
      // Branches table changes
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "branches", filter: `owner_id=eq.${authUser.id}` },
        (payload) => {
          console.log("[v0] Multi-device sync: branches changed", payload)
          mutate(`gym-data-${authUser.id}`)
        },
      )
      // Profile changes
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${authUser.id}` },
        (payload) => {
          console.log("[v0] Multi-device sync: profile changed", payload)
          mutate(`gym-data-${authUser.id}`)
        },
      )
      // Staff members changes
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff_members", filter: `user_id=eq.${authUser.id}` },
        (payload) => {
          console.log("[v0] Multi-device sync: staff changed", payload)
          mutate(`gym-data-${authUser.id}`)
        },
      )
      .subscribe((status) => {
        console.log("[v0] Multi-device realtime status:", status)
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        console.log("[v0] Unsubscribing from multi-device channel")
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [authUser?.id])

  const state = {
    authUser,
    user: data?.user || null,
    branches: data?.branches || [],
    currentBranch: data?.currentBranch || null,
    staff: data?.staff || [],
    members: data?.members || [],
    payments: data?.payments || [],
    plans: data?.plans || [],
    activityLog: data?.activityLog || [],
    reminders: data?.reminders || [],
    loading: loading || isLoading,
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setAuthUser(null)
    if (authUser?.id) {
      mutate(`gym-data-${authUser.id}`, null, false)
    }
  }

  const dispatch = async (action: any) => {
    try {
      switch (action.type) {
        case "ADD_MEMBER": {
          if (!authUser?.id) {
            toast.error("Please log in first.")
            return
          }

          const memberStatus = calculateMemberStatus(action.payload.expiryDate)

          const optimisticMember: Member = {
            id: `temp-${Date.now()}`,
            user_id: authUser.id,
            branch_id: state.currentBranch?.id || null,
            name: action.payload.name,
            email: action.payload.email,
            phone: action.payload.phone,
            plan_duration: action.payload.planDuration,
            joining_date: action.payload.joinDate,
            expiry_date: action.payload.expiryDate,
            status: memberStatus,
          }

          const optimisticMembers = [optimisticMember, ...(data?.members || [])]
          mutate(
            `gym-data-${authUser.id}`,
            {
              ...data,
              members: optimisticMembers,
              reminders: calculateReminders(optimisticMembers),
            },
            false,
          )

          const { data: newMember, error } = await supabase.rpc("add_member", {
            p_user_id: authUser.id,
            p_name: action.payload.name,
            p_email: action.payload.email,
            p_phone: action.payload.phone,
            p_joining_date: action.payload.joinDate,
            p_plan_duration: action.payload.planDuration,
            p_branch_id: state.currentBranch?.id || null,
          })

          if (error) throw error

          const memberWithStatus = { ...newMember, status: memberStatus }
          const finalMembers = [memberWithStatus, ...(data?.members || []).filter((m) => m.id !== optimisticMember.id)]
          mutate(
            `gym-data-${authUser.id}`,
            {
              ...data,
              members: finalMembers,
              reminders: calculateReminders(finalMembers),
            },
            false,
          )

          toast.success("Member added successfully!")
          break
        }

        case "UPDATE_MEMBER": {
          if (!authUser?.id) return

          const memberStatus = calculateMemberStatus(action.payload.expiryDate)

          const optimisticMembers = (data?.members || []).map((m) =>
            m.id === action.payload.id ? { ...m, ...action.payload, status: memberStatus } : m,
          )

          mutate(
            `gym-data-${authUser.id}`,
            {
              ...data,
              members: optimisticMembers,
              reminders: calculateReminders(optimisticMembers),
            },
            false,
          )

          const { data: updatedMember, error } = await supabase.rpc("update_member", {
            p_member_id: action.payload.id,
            p_name: action.payload.name,
            p_email: action.payload.email,
            p_phone: action.payload.phone,
            p_joining_date: action.payload.joinDate,
            p_plan_duration: action.payload.planDuration,
            p_expiry_date: action.payload.expiryDate,
            p_status: memberStatus,
          })

          if (error) throw error

          const memberWithStatus = { ...updatedMember, status: memberStatus }
          const finalMembers = (data?.members || []).map((m) => (m.id === action.payload.id ? memberWithStatus : m))

          mutate(
            `gym-data-${authUser.id}`,
            {
              ...data,
              members: finalMembers,
              reminders: calculateReminders(finalMembers),
            },
            false,
          )

          toast.success("Member updated successfully!")
          break
        }

        case "DELETE_MEMBER": {
          const optimisticMembers = (data?.members || []).filter((m) => m.id !== action.payload)

          mutate(
            `gym-data-${authUser.id}`,
            {
              ...data,
              members: optimisticMembers,
              reminders: calculateReminders(optimisticMembers),
            },
            false,
          )

          const { error } = await supabase.rpc("delete_member", { p_member_id: action.payload })

          if (error) throw error
          toast.success("Member deleted successfully!")
          break
        }

        case "ADD_PAYMENT": {
          if (!authUser?.id) {
            toast.error("Please log in first.")
            return
          }

          const member = (data?.members || []).find((m) => m.name === action.payload.memberName)
          if (!member) {
            toast.error("Member not found")
            return
          }

          const optimisticPayment: Payment = {
            id: `temp-${Date.now()}`,
            user_id: authUser.id,
            branch_id: state.currentBranch?.id || null,
            member_id: member.id,
            member_name: action.payload.memberName,
            amount: action.payload.amount,
            payment_method: action.payload.mode,
            payment_date: action.payload.paymentDate || new Date().toISOString().split("T")[0],
            status: "completed",
            plan_name: action.payload.planName,
          }

          mutate(
            `gym-data-${authUser.id}`,
            {
              ...data,
              payments: [optimisticPayment, ...(data?.payments || [])],
            },
            false,
          )

          const { data: newPayment, error } = await supabase.rpc("add_payment", {
            p_user_id: authUser.id,
            p_branch_id: state.currentBranch?.id || null,
            p_member_id: member.id,
            p_member_name: action.payload.memberName,
            p_amount: action.payload.amount,
            p_payment_method: action.payload.mode,
            p_payment_date: action.payload.paymentDate || new Date().toISOString().split("T")[0],
          })

          if (error) throw error

          mutate(
            `gym-data-${authUser.id}`,
            {
              ...data,
              payments: [newPayment, ...(data?.payments || []).filter((p) => p.id !== optimisticPayment.id)],
            },
            false,
          )

          toast.success("Payment added successfully!")
          break
        }

        case "ADD_PLAN": {
          if (!authUser?.id) {
            toast.error("Please log in first.")
            return
          }

          const optimisticPlan: Plan = {
            id: `temp-${Date.now()}`,
            user_id: authUser.id,
            branch_id: state.currentBranch?.id || null,
            name: action.payload.name,
            duration: action.payload.duration,
            price: action.payload.price,
            features: action.payload.features || [],
          }

          mutate(
            `gym-data-${authUser.id}`,
            {
              ...data,
              plans: [optimisticPlan, ...(data?.plans || [])],
            },
            false,
          )

          const { data: newPlan, error } = await supabase.rpc("add_plan", {
            p_user_id: authUser.id,
            p_branch_id: state.currentBranch?.id || null,
            p_name: action.payload.name,
            p_price: action.payload.price,
            p_duration: action.payload.duration,
            p_features: action.payload.features || [],
          })

          if (error) throw error

          mutate(
            `gym-data-${authUser.id}`,
            {
              ...data,
              plans: [newPlan, ...(data?.plans || []).filter((p) => p.id !== optimisticPlan.id)],
            },
            false,
          )

          toast.success("Plan added successfully!")
          break
        }

        case "UPDATE_PLAN": {
          const optimisticPlans = (data?.plans || []).map((p) =>
            p.id === action.payload.id ? { ...p, ...action.payload } : p,
          )

          mutate(
            `gym-data-${authUser.id}`,
            {
              ...data,
              plans: optimisticPlans,
            },
            false,
          )

          const { data: updatedPlan, error } = await supabase.rpc("update_plan", {
            p_plan_id: action.payload.id,
            p_name: action.payload.name,
            p_price: action.payload.price,
            p_duration: action.payload.duration,
            p_features: action.payload.features || [],
          })

          if (error) throw error

          mutate(
            `gym-data-${authUser.id}`,
            {
              ...data,
              plans: (data?.plans || []).map((p) => (p.id === action.payload.id ? updatedPlan : p)),
            },
            false,
          )

          toast.success("Plan updated successfully!")
          break
        }

        case "DELETE_PLAN": {
          mutate(
            `gym-data-${authUser.id}`,
            {
              ...data,
              plans: (data?.plans || []).filter((p) => p.id !== action.payload),
            },
            false,
          )

          const { error } = await supabase.rpc("delete_plan", { p_plan_id: action.payload })

          if (error) throw error
          toast.success("Plan deleted successfully!")
          break
        }

        case "SWITCH_BRANCH": {
          const branch = (data?.branches || []).find((b) => b.id === action.payload)
          if (branch) {
            mutate(
              `gym-data-${authUser.id}`,
              {
                ...data,
                currentBranch: branch,
              },
              false,
            )
          }
          break
        }

        default:
          break
      }
    } catch (error: any) {
      console.error("Dispatch error:", error)
      toast.error(`Error: ${error.message}`)
      if (authUser?.id) {
        mutate(`gym-data-${authUser.id}`)
      }
    }
  }

  return { state, dispatch, logout }
}
