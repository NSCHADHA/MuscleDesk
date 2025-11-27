"use client"

import { useState, useEffect } from "react"
import { Plus, Filter, X } from "lucide-react"
import { useGymData } from "@/hooks/useGymData"

interface PaymentsProps {
  searchQuery?: string
}

export function Payments({ searchQuery = "" }: PaymentsProps) {
  const { state, dispatch } = useGymData()
  const payments = state.payments
  const members = state.members

  const [filterMode, setFilterMode] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [localSearchTerm, setLocalSearchTerm] = useState("")
  const [newPayment, setNewPayment] = useState({
    plan: "Standard",
    amount: 0,
    mode: "upi",
    status: "completed",
    paymentDate: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (searchQuery) {
      setLocalSearchTerm(searchQuery)
    }
  }, [searchQuery])

  useEffect(() => {
    const handleTriggerAddPayment = () => {
      setShowAddModal(true)
    }

    window.addEventListener("triggerAddPayment", handleTriggerAddPayment)
    return () => window.removeEventListener("triggerAddPayment", handleTriggerAddPayment)
  }, [])

  const totalCompleted = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)

  const filteredPayments = payments.filter((p) => {
    const matchesMode = filterMode === "all" || p.payment_method === filterMode
    const matchesSearch = localSearchTerm
      ? p.member_name?.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        false ||
        p.amount.toString().includes(localSearchTerm)
      : true
    return matchesMode && matchesSearch
  })

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    const dateA = a.payment_date || a.created_at || "1970-01-01"
    const dateB = b.payment_date || b.created_at || "1970-01-01"
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  const handleAddPayment = async () => {
    const selectedMember = members.find((m) => m.id === selectedMemberId)
    if (selectedMember && newPayment.amount > 0) {
      await dispatch({
        type: "ADD_PAYMENT",
        payload: {
          memberName: selectedMember.name,
          amount: newPayment.amount,
          mode: newPayment.mode,
          planName: newPayment.plan,
          status: newPayment.status,
          paymentDate: newPayment.paymentDate,
        },
      })
      setSelectedMemberId("")
      setNewPayment({
        plan: "Standard",
        amount: 0,
        mode: "upi",
        status: "completed",
        paymentDate: new Date().toISOString().split("T")[0],
      })
      setShowAddModal(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">Track all payment transactions.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 justify-center">
          <Plus size={20} /> Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="stat-card">
          <p className="text-xs md:text-sm text-muted-foreground mb-2">Total Collected</p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">₹{totalCompleted.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs md:text-sm text-muted-foreground mb-2">Pending</p>
          <p className="text-2xl md:text-3xl font-bold text-orange-600">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs md:text-sm text-muted-foreground mb-2">Total Transactions</p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{payments.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
        <Filter size={18} className="text-muted-foreground hidden sm:block" />
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="form-input w-full sm:max-w-xs text-sm"
        >
          <option value="all">All Payment Methods</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="cash">Cash</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="stat-card overflow-x-auto">
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-muted-foreground">Member</th>
              <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-muted-foreground hidden sm:table-cell">
                Plan
              </th>
              <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-muted-foreground">Amount</th>
              <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-muted-foreground hidden md:table-cell">
                Mode
              </th>
              <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-muted-foreground hidden lg:table-cell">
                Date
              </th>
              <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedPayments.map((payment) => (
              <tr key={payment.id} className="border-b border-border hover:bg-muted/30">
                <td className="py-3 md:py-4 px-3 md:px-6">
                  <span className="font-medium text-foreground text-sm md:text-base">
                    {payment.member_name || "N/A"}
                  </span>
                </td>
                <td className="py-3 md:py-4 px-3 md:px-6 text-muted-foreground text-xs md:text-sm hidden sm:table-cell">
                  {payment.plan_name || "N/A"}
                </td>
                <td className="py-3 md:py-4 px-3 md:px-6">
                  <span className="font-bold text-foreground text-sm md:text-base">₹{payment.amount}</span>
                </td>
                <td className="py-3 md:py-4 px-3 md:px-6 text-foreground text-xs md:text-sm hidden md:table-cell uppercase">
                  {payment.payment_method}
                </td>
                <td className="py-3 md:py-4 px-3 md:px-6 text-muted-foreground text-xs hidden lg:table-cell">
                  {payment.payment_date || payment.created_at?.split("T")[0] || "N/A"}
                </td>
                <td className="py-3 md:py-4 px-3 md:px-6">
                  <span
                    className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${payment.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900/30" : "bg-orange-100 text-orange-800 dark:bg-orange-900/30"}`}
                  >
                    {payment.status === "completed" ? "✓ Done" : "⏳ Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedPayments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No payments recorded yet</div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Record Payment</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Select Member</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="form-input w-full"
                >
                  <option value="">-- Select Member --</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.phone})
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={newPayment.plan}
                onChange={(e) => setNewPayment({ ...newPayment, plan: e.target.value })}
                className="form-input"
              >
                <option>Basic</option>
                <option>Standard</option>
                <option>Premium</option>
              </select>
              <input
                type="number"
                placeholder="Amount (₹)"
                value={newPayment.amount || ""}
                onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                className="form-input"
              />
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Payment Method</label>
                <select
                  value={newPayment.mode}
                  onChange={(e) => setNewPayment({ ...newPayment, mode: e.target.value })}
                  className="form-input"
                >
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Payment Date</label>
                <input
                  type="date"
                  value={newPayment.paymentDate}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                  className="form-input"
                />
              </div>
              <select
                value={newPayment.status}
                onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value })}
                className="form-input"
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={!selectedMemberId || newPayment.amount <= 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
