import React from 'react';

export function M3Button({
  children,
  onClick,
  variant = 'filled',
  disabled = false,
  className = '',
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}) {
  const base =
    'h-12 px-6 rounded-2xl font-semibold text-sm inline-flex items-center justify-center gap-2.5 transition-all duration-150 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap active:scale-[0.98] shadow-sm';

  const variants = {
    filled:
      'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:bg-emerald-600',
    tonal:
      'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700/60 active:bg-slate-800',
    outlined:
      'border border-slate-700 hover:bg-slate-800/60 text-slate-200 active:bg-slate-800',
    text: 'hover:bg-slate-800/50 text-emerald-400 px-3 shadow-none',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 active:bg-rose-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

export function M3Card({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-800/80 bg-slate-900/90 p-4 transition-all duration-150 ${
        onClick
          ? 'cursor-pointer hover:border-slate-700 hover:bg-slate-850 active:scale-[0.99]'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function M3ProgressBar({
  progress,
  className = '',
  barColor = 'bg-emerald-500',
}: {
  progress: number; // 0 to 1
  className?: string;
  barColor?: string;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-800 ${className}`}>
      <div
        className={`h-full transition-all duration-500 ease-out ${barColor}`}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}

/**
 * Material 3 Circular Storage Dial Gauge
 * Beautiful circular SVG track with smooth stroke dash
 */
export function M3StorageDial({
  usedPercent,
  usedLabel,
  freeLabel,
  totalLabel,
  size = 190,
}: {
  usedPercent: number;
  usedLabel: string;
  freeLabel: string;
  totalLabel: string;
  size?: number;
}) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc angle: 260 degrees arc for speedometer-like gauge
  const arcRatio = 0.75;
  const strokeDasharray = `${circumference * arcRatio} ${circumference * (1 - arcRatio)}`;
  const strokeDashoffset = circumference * arcRatio * (1 - Math.min(1, usedPercent / 100));

  const strokeColor =
    usedPercent > 90
      ? 'stroke-rose-500'
      : usedPercent > 80
      ? 'stroke-amber-500'
      : 'stroke-emerald-400';

  return (
    <div className="relative flex flex-col items-center justify-center py-2">
      <svg
        width={size}
        height={size}
        className="rotate-[135deg] transform transition-transform duration-500"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          className="text-slate-800/80"
        />
        {/* Active Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`${strokeColor} transition-all duration-700 ease-out`}
        />
      </svg>

      {/* Center Metrics */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pt-2">
        <span className="text-[11px] font-medium text-slate-400 tracking-wide">Storage Used</span>
        <div className="text-3xl font-extrabold font-mono text-slate-100 tracking-tight my-0.5">
          {usedPercent}%
        </div>
        <div className="text-xs font-mono font-medium text-slate-300">
          {usedLabel} <span className="text-slate-500">/</span> {totalLabel}
        </div>
        <span className="text-[11px] font-mono text-emerald-400 mt-1 font-semibold">
          {freeLabel} free
        </span>
      </div>
    </div>
  );
}

/**
 * Authentic Material 3 Navigation Bar (Bottom Tabs)
 * Ergonomic thumb reach zone navigation
 */
export function M3BottomNav({
  tabs,
  activeTab,
  onSelectTab,
}: {
  tabs: { id: string; label: string; icon: React.ReactNode; badge?: number }[];
  activeTab: string;
  onSelectTab: (id: string) => void;
}) {
  return (
    <div className="h-16 px-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around shrink-0 select-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-1 group cursor-pointer focus:outline-none"
          >
            {/* M3 Active Indicator Pill */}
            <div
              className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 scale-100 font-semibold'
                  : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/40'
              }`}
            >
              {tab.icon}
            </div>
            {/* Label */}
            <span
              className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 group-hover:text-slate-300'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
