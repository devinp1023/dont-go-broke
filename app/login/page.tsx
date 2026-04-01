'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError('Something went wrong. Please try again.')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="card-elevated w-full max-w-sm p-8">
        <h1 className="text-display font-display text-neutral-900 text-center mb-6">Don&apos;t Go Broke</h1>

        {sent ? (
          <p className="text-body text-neutral-500 text-center">
            Check your email for the magic link.
          </p>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
            <button
              type="submit"
              className="btn btn-primary w-full justify-center"
            >
              Send magic link
            </button>
            {error && (
              <p className="text-label text-danger-400 text-center">{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
