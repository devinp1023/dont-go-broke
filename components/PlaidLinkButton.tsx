'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { useToast } from '@/components/Toast'

export default function PlaidLinkButton({ onSuccess }: { onSuccess: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState(false)
  const { toastEl, showToast } = useToast()

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch('/api/plaid/create-link-token', { method: 'POST' })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setLinkToken(data.link_token)
      } catch {
        setTokenError(true)
      }
    }
    fetchToken()
  }, [])

  const handleSuccess = useCallback(
    async (publicToken: string, metadata: { institution: { name: string; institution_id: string } | null }) => {
      try {
        const res = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_token: publicToken,
            institution_name: metadata.institution?.name,
            institution_id: metadata.institution?.institution_id,
          }),
        })
        if (!res.ok) throw new Error()
        onSuccess()
      } catch {
        showToast('Failed to connect bank account')
      }
    },
    [onSuccess, showToast]
  )

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleSuccess,
  })

  return (
    <>
      <button
        onClick={() => open()}
        disabled={!ready || tokenError}
        className="btn btn-primary disabled:opacity-50"
      >
        {tokenError ? 'Unavailable' : 'Connect Bank'}
      </button>
      {toastEl}
    </>
  )
}
