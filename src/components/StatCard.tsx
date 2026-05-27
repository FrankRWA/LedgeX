import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'orange' | 'red'
  trend?: string
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-700',
    value: 'text-blue-900',
    border: 'border-blue-100',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-700',
    value: 'text-green-900',
    border: 'border-green-100',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-100 text-orange-700',
    value: 'text-orange-900',
    border: 'border-orange-100',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-700',
    value: 'text-red-900',
    border: 'border-red-100',
  },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${c.value}`}>{value}</p>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 ${c.icon} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <p className="text-gray-400 text-xs mt-3 pt-3 border-t border-gray-100">{trend}</p>
      )}
    </div>
  )
}
