'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'

export default function PlaidLinkButton({ onSuccess }: { onSuccess: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null)

  useEffect(() => {
    async function fetchToken() {
      const res = await fetch('/api/plaid/create-link-token', { method: 'POST' })
      const data = await res.json()
      setLinkToken(data.link_token)
    }
    fetchToken()
  }, [])

  const handleSuccess = useCallback(
    async (publicToken: string, metadata: { institution: { name: string } | null }) => {
      await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token: publicToken,
          institution_name: metadata.institution?.name,
        }),
      })
      onSuccess()
    },
    [onSuccess]
  )

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleSuccess,
  })

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="btn btn-primary disabled:opacity-50"
    >
      Connect Bank
    </button>
  )
}
