'use client'

import { useState, useRef, useEffect } from 'react'

type Transaction = {
  id: string
  date: string
  name: string
  merchant_name: string | null
  amount: number
  category: string | null
}

function prettifyCategory(raw: string) {
  return raw.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

const ALL_CATEGORIES = [
  'INCOME',
  'RENT',
  'UTILITIES',
  'RESTAURANTS',
  'GROCERIES',
  'SHOPPING',
  'TRAVEL',
  'BARS_AND_NIGHTLIFE',
  'ENTERTAINMENT',
  'TRANSPORTATION',
  'GYM',
  'PERSONAL_CARE',
  'HEALTH',
  'INTERNAL_TRANSFER',
  'OTHER',
]

const categoryBadgeClass: Record<string, string> = {
  income: 'badge-cat-income',
  rent: 'badge-cat-rent',
  utilities: 'badge-cat-utilities',
  restaurants: 'badge-cat-restaurants',
  groceries: 'badge-cat-groceries',
  shopping: 'badge-cat-shopping',
  travel: 'badge-cat-travel',
  bars_and_nightlife: 'badge-cat-bars-and-nightlife',
  entertainment: 'badge-cat-entertainment',
  transportation: 'badge-cat-transportation',
  gym: 'badge-cat-gym',
  personal_care: 'badge-cat-personal-care',
  health: 'badge-cat-health',
  internal_transfer: 'badge-cat-internal-transfer',
  other: 'badge-cat-other',
}

function getCategoryBadge(category: string): string {
  return categoryBadgeClass[category.toLowerCase()] || 'badge-neutral'
}

function CategoryDropdown({
  currentCategory,
  onSelect,
  onClose,
}: {
  currentCategory: string | null
  onSelect: (category: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="category-dropdown absolute left-0 top-full mt-1 bg-white border border-neutral-100 rounded-lg shadow-elevated z-50 py-1 max-h-64 overflow-y-auto"
      style={{ minWidth: 200, animation: 'dropdownIn 0.15s ease-out', transformOrigin: 'top left' }}
    >
      {ALL_CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 flex items-center gap-2 transition-colors"
        >
          <span className={`badge ${getCategoryBadge(cat)}`}>
            {prettifyCategory(cat)}
          </span>
          {currentCategory?.toUpperCase() === cat && (
            <span className="text-sg-500 text-label ml-auto">&#10003;</span>
          )}
        </button>
      ))}
    </div>
  )
}

export default function TransactionList({
  transactions,
  onCategoryChange,
}: {
  transactions: Transaction[]
  onCategoryChange?: (txnId: string, newCategory: string) => void
}) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏦</div>
        <div className="empty-title">No transactions yet</div>
        <div className="empty-desc">Connect a bank to get started.</div>
      </div>
    )
  }

  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, txn) => {
    const key = txn.date
    if (!acc[key]) acc[key] = []
    acc[key].push(txn)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date} className="card">
          <div className="px-4 py-3 text-label font-display text-neutral-900 border-b border-neutral-100">
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          {grouped[date].map((txn) => (
            <div key={txn.id} className="tx-row">
              <div className="tx-icon">💳</div>
              <div className="tx-info">
                <div className="tx-name">{txn.merchant_name || txn.name}</div>
                <div className="tx-meta relative">
                  <span
                    className={`badge cursor-pointer ${txn.category ? getCategoryBadge(txn.category) : 'badge-neutral'}`}
                    onClick={() => setOpenDropdownId(openDropdownId === txn.id ? null : txn.id)}
                  >
                    {txn.category ? prettifyCategory(txn.category) : 'Uncategorized'}
                  </span>
                  {openDropdownId === txn.id && onCategoryChange && (
                    <CategoryDropdown
                      currentCategory={txn.category}
                      onSelect={(cat) => {
                        onCategoryChange(txn.id, cat)
                        setOpenDropdownId(null)
                      }}
                      onClose={() => setOpenDropdownId(null)}
                    />
                  )}
                </div>
              </div>
              <div className="tx-right">
                <div className={`tx-amount ${txn.amount > 0 ? 'debit' : 'credit'}`}>
                  {txn.amount > 0 ? '-' : '+'}${Math.abs(txn.amount).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
