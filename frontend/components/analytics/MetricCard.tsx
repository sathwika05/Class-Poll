interface Props {
  label: string
  value: string | number
  subtext?: string
  accent?: 'blue' | 'green' | 'purple' | 'orange'
}

const ACCENTS = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-green-50 text-green-700 border-green-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
}

export default function MetricCard({ label, value, subtext, accent = 'blue' }: Props) {
  return (
    <div className={`rounded-2xl border p-5 ${ACCENTS[accent]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subtext && <p className="text-xs mt-1 opacity-70">{subtext}</p>}
    </div>
  )
}
