"use client"

import { TrendingUp, Users, DollarSign, UserCheck, Activity, Plus, Bell, FileText } from "lucide-react"
import { useGymData } from "@/hooks/useGymData"

export function Dashboard() {
  const { state } = useGymData()
  const { members, payments } = state

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Each member should only be counted in ONE category

  // First, categorize expired members (expiry date is in the past)
  const expiredMembers = members.filter((m) => {
    const expiryDate = new Date(m.expiry_date)
    expiryDate.setHours(0, 0, 0, 0)
    return expiryDate < today
  })

  // Second, categorize expiring members (expiry within 1-7 days from today)
  const expiringMembers = members.filter((m) => {
    const expiryDate = new Date(m.expiry_date)
    expiryDate.setHours(0, 0, 0, 0)
    const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    // Only count as expiring if: 1 to 7 days left (not expired, not too far in future)
    return daysLeft > 0 && daysLeft <= 7
  })

  // Finally, active members (expiry is more than 7 days away)
  const activeMembers = members.filter((m) => {
    const expiryDate = new Date(m.expiry_date)
    expiryDate.setHours(0, 0, 0, 0)
    const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    // Active only if more than 7 days left
    return daysLeft > 7
  })

  // Verification: total should always equal members.length
  console.log(
    "[v0] Member counts - Total:",
    members.length,
    "Active:",
    activeMembers.length,
    "Expiring:",
    expiringMembers.length,
    "Expired:",
    expiredMembers.length,
  )

  const quickActions = [
    {
      icon: Plus,
      title: "Add Member",
      description: "Register new gym member",
      onClick: () => {
        // Navigate to members page and open add modal
        const event = new CustomEvent("openAddMember")
        window.dispatchEvent(event)
      },
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: DollarSign,
      title: "Record Payment",
      description: "Process member payments",
      onClick: () => {
        const event = new CustomEvent("openAddPayment")
        window.dispatchEvent(event)
      },
      gradient: "from-accent to-yellow-600",
    },
    {
      icon: Bell,
      title: "Send Reminders",
      description: "Notify expiring members",
      onClick: () => {
        const event = new CustomEvent("navigateToReminders")
        window.dispatchEvent(event)
      },
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: FileText,
      title: "Manage Plans",
      description: "Update membership plans",
      onClick: () => {
        const event = new CustomEvent("navigateToPlans")
        window.dispatchEvent(event)
      },
      gradient: "from-purple-500 to-pink-500",
    },
  ]

  const stats = [
    {
      label: "Total Members",
      value: members.length,
      icon: Users,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
    },
    {
      label: "Active Members",
      value: activeMembers.length,
      icon: UserCheck,
      color: "bg-green-50 text-green-600 dark:bg-green-900/20",
    },
    {
      label: "Expiring Soon",
      value: expiringMembers.length,
      icon: TrendingUp,
      color: "bg-orange-50 text-orange-600 dark:bg-orange-900/20",
    },
    {
      label: "Monthly Revenue",
      value: `₹${payments
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0)
        .toLocaleString()}`,
      icon: DollarSign,
      color: "bg-accent/10 text-accent",
    },
  ]

  const recentActivities = [
    ...members.slice(-3).map((m) => ({
      id: `member-${m.id}`,
      type: "member",
      icon: Users,
      text: `${m.name} joined`,
      time: m.joining_date || "1970-01-01",
      color: "text-blue-600",
    })),
    ...payments.slice(-3).map((p) => ({
      id: `payment-${p.id}`,
      type: "payment",
      icon: DollarSign,
      text: `Payment of ₹${p.amount} from ${p.member_name || "Unknown"}`,
      time: p.payment_date || p.created_at || "1970-01-01",
      color: "text-green-600",
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5)

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Welcome back! Here's your gym's performance overview.
        </p>
      </div>

      {/* Stats Grid - Responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="stat-card animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-lg ${stat.color} flex-shrink-0`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions Section - Now below stats */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon
            return (
              <button
                key={idx}
                onClick={action.onClick}
                className="group relative overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 text-left transition-all hover:scale-[1.02] hover:shadow-lg hover:border-accent/50 animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="relative z-10">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${action.gradient} mb-4`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">{action.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{action.description}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Charts Section - Responsive: stacked mobile, split on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 stat-card animate-fade-in">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Activity size={20} className="text-accent" />
            <h2 className="text-lg md:text-lg font-bold text-foreground">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const Icon = activity.icon
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg bg-muted ${activity.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No recent activity</div>
            )}
          </div>
        </div>

        {/* Membership Distribution */}
        <div className="stat-card animate-fade-in">
          <h2 className="text-lg md:text-lg font-bold text-foreground mb-4 md:mb-6">Membership Status</h2>
          <div className="space-y-4">
            {[
              {
                label: "Active",
                count: activeMembers.length,
                color: "bg-green-500",
              },
              {
                label: "Expiring",
                count: expiringMembers.length,
                color: "bg-orange-500",
              },
              {
                label: "Expired",
                count: expiredMembers.length,
                color: "bg-red-500",
              },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-sm font-bold text-foreground">{item.count}</p>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color}`}
                    style={{ width: `${(item.count / (members.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
