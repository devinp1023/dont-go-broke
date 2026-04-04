'use client'

// Deterministic color from institution name
const LOGO_COLORS = [
  '#1fa678', '#2563eb', '#7c3aed', '#db2777', '#ea580c',
  '#0891b2', '#4f46e5', '#059669', '#d97706', '#6366f1',
]

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length]
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

interface InstitutionLogoProps {
  name: string
  logo: string | null
  size?: number
}

export default function InstitutionLogo({ name, logo, size = 36 }: InstitutionLogoProps) {
  if (logo) {
    const src = logo.startsWith('data:') ? logo : `data:image/png;base64,${logo}`
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ borderRadius: 8, flexShrink: 0 }}
      />
    )
  }

  const color = getColor(name)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        backgroundColor: color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
    >
      {getInitials(name)}
    </div>
  )
}
