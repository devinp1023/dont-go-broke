'use client'

import { PieChart, Pie, Cell } from 'recharts'

export type DonutSlice = { name: string; value: number; color: string }

export function DonutChart({ data, colors }: { data: DonutSlice[]; colors: string[] }) {
  return (
    <PieChart width={220} height={220}>
      <Pie
        data={data}
        cx={110}
        cy={110}
        innerRadius={58}
        outerRadius={95}
        paddingAngle={4}
        cornerRadius={6}
        dataKey="value"
        startAngle={90}
        endAngle={-270}
        stroke="none"
        isAnimationActive={false}
      >
        {data.map((_, i) => (
          <Cell key={i} fill={colors[i % colors.length]} />
        ))}
      </Pie>
    </PieChart>
  )
}
