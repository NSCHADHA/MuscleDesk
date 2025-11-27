"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, RotateCw, X } from "lucide-react"
import { useGymData } from "@/hooks/useGymData"

interface MembersProps {
  searchQuery?: string
}

export function Members({ searchQuery = "" }: MembersProps) {
  const { state, dispatch } = useGymData()
  const members = state.members

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expiring" | "expired">("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    plan: "Standard",
    planDuration: 1 as 1 | 3 | 6 | 12,
    joiningDate: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (searchQuery) {
      setSearchTerm(searchQuery)
    }
  }, [searchQuery])

  useEffect(() => {
    const handleTriggerAddMember = () => {
      setEditingId(null)
      setNewMember({
        name: "",
        email: "",
        phone: "",
        plan: "Standard",
        planDuration: 1,
        joiningDate: new Date().toISOString().split("T")[0],
      })
      setShowAddModal(true)
    }

    window.addEventListener("triggerAddMember", handleTriggerAddMember)
    return () => window.removeEventListener("triggerAddMember", handleTriggerAddMember)
  }, [])

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm)
    const matchesStatus = filterStatus === "all" || member.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleAddMember = async () => {
    if (newMember.name && newMember.email && newMember.phone) {
      try {
        const joiningDate = new Date(newMember.joiningDate)
        const expiryDate = new Date(joiningDate)
        expiryDate.setMonth(expiryDate.getMonth() + newMember.planDuration)

        const expiryDateStr = expiryDate.toISOString().split("T")[0]
        const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

        let status: "active" | "expiring" | "expired" = "active"
        if (daysLeft < 0) {
          status = "expired"
        } else if (daysLeft <= 7) {
          status = "expiring"
        }

        if (editingId) {
          await dispatch({
            type: "UPDATE_MEMBER",
            payload: {
              id: editingId,
              name: newMember.name,
              email: newMember.email,
              phone: newMember.phone,
              planDuration: newMember.planDuration,
              joinDate: newMember.joiningDate,
              expiryDate: expiryDateStr,
            },
          })
          setEditingId(null)
        } else {
          await dispatch({
            type: "ADD_MEMBER",
            payload: {
              name: newMember.name,
              email: newMember.email,
              phone: newMember.phone,
              planDuration: newMember.planDuration,
              joinDate: newMember.joiningDate,
              expiryDate: expiryDateStr,
            },
          })
        }

        setNewMember({
          name: "",
          email: "",
          phone: "",
          plan: "Standard",
          planDuration: 1,
          joiningDate: new Date().toISOString().split("T")[0],
        })
        setShowAddModal(false)
      } catch (error) {
        // Removed console.error, error is already handled in dispatch
      }
    }
  }

  const handleEditMember = (member: any) => {
    setEditingId(member.id)
    setNewMember({
      name: member.name,
      email: member.email,
      phone: member.phone,
      plan: `${member.plan_duration} month${member.plan_duration > 1 ? "s" : ""}`,
      planDuration: member.plan_duration,
      joiningDate: member.joining_date,
    })
    setShowAddModal(true)
  }

  const handleDeleteMember = async (id: string) => {
    if (confirm("Are you sure you want to delete this member?")) {
      try {
        await dispatch({ type: "DELETE_MEMBER", payload: id })
      } catch (error) {
        // Removed console.error, error is already handled in dispatch
      }
    }
  }

  const handleRenewMember = async (id: string) => {
    const member = members.find((m) => m.id === id)
    if (member) {
      try {
        const newJoinDate = new Date().toISOString().split("T")[0]
        const expiryDate = new Date()
        expiryDate.setMonth(expiryDate.getMonth() + member.plan_duration)
        const newExpiryDate = expiryDate.toISOString().split("T")[0]

        await dispatch({
          type: "UPDATE_MEMBER",
          payload: {
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            plan_duration: member.plan_duration,
            joining_date: newJoinDate,
            expiry_date: newExpiryDate,
            status: "active",
          },
        })
      } catch (error) {
        // Removed console.error, error is already handled in dispatch
      }
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "expiring":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Members</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Manage your gym members and their memberships.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null)
            setNewMember({
              name: "",
              email: "",
              phone: "",
              plan: "Standard",
              planDuration: 1,
              joiningDate: new Date().toISOString().split("T")[0],
            })
            setShowAddModal(true)
          }}
          className="btn-primary flex items-center gap-2 justify-center"
        >
          <Plus size={20} /> Add Member
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-12 w-full text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="form-input px-4 py-3 text-sm"
        >
          <option value="all">All Members</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="stat-card overflow-x-auto">
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-muted-foreground">Name</th>
              <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-muted-foreground hidden sm:table-cell">
                Email
              </th>
              <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-muted-foreground">Plan</th>
              <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-muted-foreground">Status</th>
              <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-muted-foreground hidden md:table-cell">
                Expiry
              </th>
              <th className="text-right py-3 md:py-4 px-3 md:px-6 font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="py-3 md:py-4 px-3 md:px-6">
                  <span className="font-medium text-foreground text-sm md:text-base">{member.name}</span>
                </td>
                <td className="py-3 md:py-4 px-3 md:px-6 text-muted-foreground text-xs md:text-sm hidden sm:table-cell">
                  {member.email}
                </td>
                <td className="py-3 md:py-4 px-3 md:px-6">
                  <span className="font-medium text-foreground text-xs md:text-sm">
                    {member.plan_duration} month{member.plan_duration > 1 ? "s" : ""}
                  </span>
                </td>
                <td className="py-3 md:py-4 px-3 md:px-6">
                  <span
                    className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(member.status)}`}
                  >
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 md:py-4 px-3 md:px-6 text-muted-foreground text-xs md:text-sm hidden md:table-cell">
                  {member.expiry_date}
                </td>
                <td className="py-3 md:py-4 px-3 md:px-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {member.status !== "active" && (
                      <button
                        onClick={() => handleRenewMember(member.id)}
                        className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                        title="Renew Membership"
                      >
                        <RotateCw size={16} className="text-accent" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditMember(member)}
                      className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} className="text-primary" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMembers.length === 0 && <div className="text-center py-8 text-muted-foreground">No members found</div>}
      </div>

      {/* Add/Edit Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content max-h-[90vh] overflow-y-auto w-full md:w-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">{editingId ? "Edit Member" : "Add New Member"}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="form-input"
              />
              <input
                type="email"
                placeholder="Email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                className="form-input"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                className="form-input"
              />
              <select
                value={newMember.plan}
                onChange={(e) => setNewMember({ ...newMember, plan: e.target.value })}
                className="form-input"
              >
                <option>Basic</option>
                <option>Standard</option>
                <option>Premium</option>
              </select>
              <div>
                <label className="form-label">Joining Date</label>
                <input
                  type="date"
                  value={newMember.joiningDate}
                  onChange={(e) => setNewMember({ ...newMember, joiningDate: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Plan Duration</label>
                <select
                  value={newMember.planDuration}
                  onChange={(e) =>
                    setNewMember({ ...newMember, planDuration: Number(e.target.value) as 1 | 3 | 6 | 12 })
                  }
                  className="form-input"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleAddMember} className="btn-primary">
                  {editingId ? "Update Member" : "Add Member"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
