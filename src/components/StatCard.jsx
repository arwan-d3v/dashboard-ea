"use client";
import { MoveUpRight, MoveDownLeft } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, colorClass, gradientBgClass, trend }) {
  return (
    <div className="style-card transition-colors duration-300">
      <div className={`p-4 rounded-xl ${gradientBgClass} shadow-inner`}>
        <Icon size={22} className={colorClass} strokeWidth={2.5} />
      </div>
      <div className="flex-grow">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">{title}</p>
        <h3 className="text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] mt-1 tracking-tight">{value}</h3>
      </div>
      {trend && (
          <div className={`flex items-center gap-1.5 self-start px-2 py-1 rounded-lg ${trend > 0 ? 'bg-[var(--active-green-bg)] text-[var(--active-green)]' : 'bg-red-50 text-red-500'}`}>
              {trend > 0 ? <MoveUpRight size={14}/> : <MoveDownLeft size={14}/>}
              <span className="text-sm font-bold">{trend}%</span>
          </div>
      )}
    </div>
  );
}