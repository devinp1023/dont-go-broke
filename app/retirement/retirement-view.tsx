'use client'

import InstitutionLogo from '@/components/InstitutionLogo'

interface RetirementAccount {
  id: string
  name: string
  subtype: string
  balance: number
  currency: string
  institution: string | null
  institutionLogo: string | null
}

interface RetirementProjection {
  projectedAge: number
  yearsUntil: number
  currentBalance: number
  monthlyContribution: number
  annualGrowthRate: number
  targetBalance: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDollarShort(value: number) {
  return `$${Math.round(value).toLocaleString('en-US')}`
}

function prettifySubtype(subtype: string) {
  const labels: Record<string, string> = {
    '401k': '401(k)',
    '401a': '401(a)',
    '403b': '403(b)',
    '457b': '457(b)',
    'ira': 'Traditional IRA',
    'roth': 'Roth IRA',
    'roth 401k': 'Roth 401(k)',
    'sep ira': 'SEP IRA',
    'simple ira': 'SIMPLE IRA',
    'keogh': 'Keogh',
    'pension': 'Pension',
    'retirement': 'Retirement',
    'thrift savings plan': 'TSP',
  }
  return labels[subtype.toLowerCase()] ?? subtype
}

export default function RetirementView({
  accounts,
  totalBalance,
  projection,
}: {
  accounts: RetirementAccount[]
  totalBalance: number
  projection: RetirementProjection
}) {
  const { projectedAge, yearsUntil, currentBalance, monthlyContribution, annualGrowthRate, targetBalance } = projection
  const progressPct = Math.min(100, (currentBalance / targetBalance) * 100)

  return (
    <div>
      <h1 className="text-hero font-display text-neutral-900 mb-6">Retirement</h1>

      {/* Total balance card */}
      <div className="card mb-6">
        <div className="text-label text-neutral-400 uppercase tracking-wide mb-1">Total Retirement Balance</div>
        <div className="text-number font-display text-neutral-900">{formatCurrency(totalBalance)}</div>
      </div>

      {/* Projection card */}
      <div className="card mb-6">
        <div className="text-heading font-display text-neutral-900 mb-4">Retirement Projection</div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center">
          <div className="flex flex-col items-center md:items-start shrink-0">
            <div className="text-[56px] font-display text-sg-600 leading-none tabular-nums">{projectedAge}</div>
            <div className="text-[14px] text-neutral-400 mt-1">projected retirement age</div>
            <div className="text-[13px] text-neutral-300 mt-0.5">{yearsUntil} years from now</div>
          </div>

          <div className="flex-1 w-full">
            <div className="mb-4">
              <div className="flex justify-between text-[13px] mb-1.5">
                <span className="text-neutral-500">{formatDollarShort(currentBalance)}</span>
                <span className="text-neutral-400">{formatDollarShort(targetBalance)} goal</span>
              </div>
              <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background: 'linear-gradient(90deg, var(--color-sg-500), var(--color-sg-400))',
                  }}
                />
              </div>
              <div className="text-[12px] text-neutral-300 mt-1">{progressPct.toFixed(1)}% of goal</div>
            </div>

            <div className="flex gap-6 text-[13px]">
              <div>
                <span className="text-neutral-400">Monthly contribution</span>
                <div className="text-neutral-700 font-medium">{formatDollarShort(monthlyContribution)}</div>
              </div>
              <div>
                <span className="text-neutral-400">Growth rate</span>
                <div className="text-neutral-700 font-medium">{(annualGrowthRate * 100).toFixed(0)}% / year</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts list */}
      {accounts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-title">No retirement accounts</div>
            <div className="empty-desc">
              Connect a brokerage or employer retirement plan via Plaid to see your retirement accounts here.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((account) => (
            <div key={account.id} className="card flex items-center gap-4">
              <InstitutionLogo
                name={account.institution ?? account.name}
                logo={account.institutionLogo}
                size={40}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium text-neutral-800 truncate">{account.name}</div>
                <div className="text-[13px] text-neutral-400">
                  {prettifySubtype(account.subtype)}
                  {account.institution ? ` \u00B7 ${account.institution}` : ''}
                </div>
              </div>
              <div className="text-[17px] font-semibold tabular-nums text-neutral-900">
                {formatCurrency(account.balance)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
