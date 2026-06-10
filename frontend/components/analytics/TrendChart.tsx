'use client'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface TrendChartProps {
  data: Array<Record<string, string | number>>
  xKey: string
  yKey: string
  yLabel?: string
  type?: 'line' | 'bar'
  color?: string
}

export default function TrendChart({
  data,
  xKey,
  yKey,
  yLabel,
  type = 'line',
  color = '#2563eb',
}: TrendChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No data available yet
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    label: String(d[xKey]).slice(0, 12),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      {type === 'bar' ? (
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {yLabel && <Legend />}
          <Bar dataKey={yKey} fill={color} name={yLabel} radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {yLabel && <Legend />}
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4 }}
            name={yLabel}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  )
}
