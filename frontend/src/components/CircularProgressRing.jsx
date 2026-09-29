import React from 'react';

/**
 * Reusable Circular Progress Ring Component with SVG Stroke Animation (Light Theme)
 */
const CircularProgressRing = ({
  percentage = 0,
  size = 140,
  strokeWidth = 12,
  title,
  count,
  subtitle,
  icon: Icon,
  colorScheme = 'emerald', // 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validPercentage = Math.min(100, Math.max(0, Number(percentage) || 0));
  const strokeDashoffset = circumference - (validPercentage / 100) * circumference;

  const colorStyles = {
    indigo: {
      stroke: 'stroke-indigo-600',
      glow: 'shadow-indigo-600/20',
      text: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
      gradientFrom: '#4f46e5',
      gradientTo: '#6366f1',
    },
    emerald: {
      stroke: 'stroke-emerald-600',
      glow: 'shadow-emerald-600/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      gradientFrom: '#059669',
      gradientTo: '#10b981',
    },
    amber: {
      stroke: 'stroke-amber-600',
      glow: 'shadow-amber-600/20',
      text: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      gradientFrom: '#d97706',
      gradientTo: '#f59e0b',
    },
    rose: {
      stroke: 'stroke-rose-600',
      glow: 'shadow-rose-600/20',
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      gradientFrom: '#e11d48',
      gradientTo: '#f43f5e',
    },
    purple: {
      stroke: 'stroke-purple-600',
      glow: 'shadow-purple-600/20',
      text: 'text-purple-700 dark:text-purple-300',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      gradientFrom: '#7e22ce',
      gradientTo: '#9333ea',
    },
  };

  const currentTheme = colorStyles[colorScheme] || colorStyles.indigo;
  const gradientId = `circle-gradient-${colorScheme}-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="bg-white dark:bg-[#151D2F] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
      
      {/* Top Header Label */}
      <div className="flex items-center gap-2 mb-4">
        {Icon && (
          <div className={`p-2 rounded-xl border ${currentTheme.bg}`}>
            <Icon className={`w-4 h-4 ${currentTheme.text}`} />
          </div>
        )}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>

      {/* SVG Ring Container */}
      <div className="relative flex items-center justify-center my-2" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentTheme.gradientFrom} />
              <stop offset="100%" stopColor={currentTheme.gradientTo} />
            </linearGradient>
          </defs>

          {/* Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-800 fill-transparent"
          />

          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="fill-transparent transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {validPercentage}%
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
            Ratio
          </span>
        </div>
      </div>

      {/* Numerical Count */}
      <div className="mt-3 space-y-0.5">
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {typeof count === 'number' ? count.toLocaleString() : count}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>

    </div>
  );
};

export default CircularProgressRing;
