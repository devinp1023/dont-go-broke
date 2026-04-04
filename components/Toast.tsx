'use client'

import { useState, useCallback, useEffect } from 'react'

interface ToastData {
  message: string
  type: 'success' | 'error'
  id: number
}

export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div role="alert" className={`toast toast-${type}`} style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 200, animation: 'chatSlideUp 0.2s ease-out' }}>
      <span className="toast-icon">{type === 'success' ? '✓' : '!'}</span>
      <div>
        <div className="toast-title">{type === 'success' ? 'Success' : 'Error'}</div>
        <div className="toast-desc">{message}</div>
      </div>
    </div>
  )
}

let nextId = 0

export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type, id: nextId++ })
  }, [])

  const toastEl = toast ? (
    <Toast
      key={toast.id}
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  ) : null

  return { toastEl, showToast }
}
