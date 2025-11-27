"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Building2, User, MessageSquare, Bell, Lock, Save, Download, Smartphone } from "lucide-react"
import { useGymData } from "@/hooks/useGymData"

export function Settings() {
  const { state } = useGymData()
  const [activeTab, setActiveTab] = useState("profile")
  const [saveMessage, setSaveMessage] = useState("")
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  const [formData, setFormData] = useState({
    ownerName: state.user?.ownerName || "",
    gymName: state.user?.gymName || "",
    email: state.user?.email || "",
    phone: state.user?.phone || "",
    address: "123 Fitness Street, City, Country",
    whatsappToken: "your_token_here",
  })

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "gym", label: "Gym Information", icon: Building2 },
    { id: "pwa", label: "Install App", icon: Smartphone },
    { id: "export", label: "Export Data", icon: Download },
    { id: "whatsapp", label: "WhatsApp Integration", icon: MessageSquare },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSave = () => {
    setSaveMessage("Settings saved successfully")
    setTimeout(() => setSaveMessage(""), 3000)
  }

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      setSaveMessage("App is already installed or not installable")
      setTimeout(() => setSaveMessage(""), 3000)
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setSaveMessage("App installed successfully!")
      setIsInstallable(false)
    } else {
      setSaveMessage("Installation cancelled")
    }

    setDeferredPrompt(null)
    setTimeout(() => setSaveMessage(""), 3000)
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      setSaveMessage("No data to export")
      setTimeout(() => setSaveMessage(""), 3000)
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => JSON.stringify(row[header] || "")).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setSaveMessage(`${filename} exported successfully`)
    setTimeout(() => setSaveMessage(""), 3000)
  }

  const handleExportMembers = () => {
    const memberData = state.members.map((m) => ({
      Name: m.name,
      Email: m.email,
      Phone: m.phone,
      Duration: `${m.plan_duration} months`,
      Status: m.status,
      JoinDate: m.joining_date,
      ExpiryDate: m.expiry_date,
    }))
    exportToCSV(memberData, "members")
  }

  const handleExportPayments = () => {
    const paymentData = state.payments.map((p) => ({
      MemberName: p.member_name,
      Amount: p.amount,
      Date: p.payment_date,
      Mode: p.payment_method,
      Status: p.status,
    }))
    exportToCSV(paymentData, "payments")
  }

  const handleExportPlans = () => {
    const planData = state.plans.map((p) => ({
      Name: p.name,
      Price: p.price,
      Duration: `${p.duration} days`,
      Features: p.features.join("; "),
    }))
    exportToCSV(planData, "plans")
  }

  const handleExportRevenue = () => {
    const monthlyRevenue: { [key: string]: number } = {}
    state.payments
      .filter((p) => p.status === "completed")
      .forEach((p) => {
        const dateStr = p.payment_date || p.created_at || "1970-01-01"
        const month = dateStr.substring(0, 7)
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + p.amount
      })

    const revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      Month: month,
      Revenue: revenue,
    }))
    exportToCSV(revenueData, "monthly_revenue")
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">Manage your gym profile and preferences.</p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20">
          <p className="font-semibold text-green-900 dark:text-green-400">{saveMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab Navigation */}
        <div className="stat-card h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
                    activeTab === tab.id ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="stat-card">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-foreground">Profile Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Owner Name</label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Gym Tab */}
            {activeTab === "gym" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-foreground">Gym Information</h2>
                <div>
                  <label className="form-label">Gym Name</label>
                  <input
                    type="text"
                    name="gymName"
                    value={formData.gymName}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="form-input"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* PWA Install Tab */}
            {activeTab === "pwa" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-foreground">Install MuscleDesk App</h2>
                <p className="text-sm text-muted-foreground">
                  Install MuscleDesk as a native app on your device for offline access and faster performance
                </p>

                <div className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center">
                      <Smartphone size={32} className="text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground">Progressive Web App</h3>
                      <p className="text-sm text-muted-foreground">Works on iOS, Android, and Desktop</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full" />
                      <span className="text-foreground">Offline access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full" />
                      <span className="text-foreground">Push notifications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full" />
                      <span className="text-foreground">Fast performance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full" />
                      <span className="text-foreground">Native app experience</span>
                    </div>
                  </div>

                  <button
                    onClick={handleInstallPWA}
                    disabled={!isInstallable}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      isInstallable
                        ? "bg-accent text-accent-foreground hover:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    <Download size={20} />
                    {isInstallable ? "Install MuscleDesk App" : "App Already Installed"}
                  </button>

                  {!isInstallable && (
                    <p className="text-xs text-center text-muted-foreground">
                      The app is already installed or your browser doesn't support installation
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Export Tab */}
            {activeTab === "export" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-foreground">Export Data</h2>
                <p className="text-sm text-muted-foreground">Download your gym data in CSV format</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={handleExportMembers} className="btn-primary flex items-center gap-2 justify-center">
                    <Download size={18} /> Export Members
                  </button>
                  <button onClick={handleExportPayments} className="btn-primary flex items-center gap-2 justify-center">
                    <Download size={18} /> Export Payments
                  </button>
                  <button onClick={handleExportPlans} className="btn-primary flex items-center gap-2 justify-center">
                    <Download size={18} /> Export Plans
                  </button>
                  <button onClick={handleExportRevenue} className="btn-primary flex items-center gap-2 justify-center">
                    <Download size={18} /> Export Monthly Revenue
                  </button>
                </div>
              </div>
            )}

            {/* WhatsApp Tab */}
            {activeTab === "whatsapp" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-foreground">WhatsApp Integration</h2>
                <div>
                  <label className="form-label">API Token</label>
                  <input
                    type="password"
                    name="whatsappToken"
                    value={formData.whatsappToken}
                    onChange={handleChange}
                    className="form-input"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Get your token from WhatsApp Business API dashboard
                  </p>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-foreground">Notification Preferences</h2>
                <div className="space-y-3">
                  {["Email notifications", "SMS alerts", "WhatsApp reminders", "Weekly reports"].map((item, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 rounded-lg cursor-pointer"
                    >
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                      <span className="font-medium text-foreground">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-foreground">Security Settings</h2>
                <div className="space-y-4">
                  <button className="btn-secondary w-full">Change Password</button>
                  <button className="btn-secondary w-full">Two-Factor Authentication</button>
                  <button className="btn-secondary w-full">View Login Activity</button>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 flex justify-end gap-3">
              <button className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
