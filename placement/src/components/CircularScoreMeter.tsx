import React from 'react';

interface CircularScoreMeterProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export default function CircularScoreMeter({
  score,
  size = 120,
  strokeWidth = 10,
  showLabel = true
}: CircularScoreMeterProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine dynamic colors
  let colorClass = 'stroke-emerald-500';
  let textClass = 'text-emerald-500';
  let bgFillClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (score < 60) {
    colorClass = 'stroke-rose-500';
    textClass = 'text-rose-500';
    bgFillClass = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (score < 80) {
    colorClass = 'stroke-amber-500';
    textClass = 'text-amber-500';
    bgFillClass = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-800 fill-none"
            strokeWidth={strokeWidth}
          />
          {/* Active Score Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`fill-none transition-all duration-1000 ease-out ${colorClass}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Score Text Centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {score}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Ready
          </span>
        </div>
      </div>

      {showLabel && (
        <div className={`mt-3 px-3 py-1 text-xs font-semibold rounded-full border ${bgFillClass} transition-colors`}>
          {score >= 90 ? 'Outstanding' : score >= 80 ? 'Highly Ready' : score >= 60 ? 'Progressing' : 'Needs Focus'}
        </div>
      )}
    </div>
  );
}
