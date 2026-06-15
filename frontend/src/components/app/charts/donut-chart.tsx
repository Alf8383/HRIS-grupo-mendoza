import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface DonutChartProps {
  data: { label: string; value: number; color?: string }[]
}

const DEFAULT_COLORS = [
  'var(--primary)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function DonutChart({ data }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="85%"
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            fontSize: '0.75rem',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
