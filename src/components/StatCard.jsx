'use client';

export default function StatCard({ title, value, change, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="stat-value mt-2">{value}</p>
        </div>
        <div className={`text-4xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      
      {change && (
        <p className={`text-sm mt-4 flex items-center gap-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}% dari kemarin
        </p>
      )}
    </div>
  );
}