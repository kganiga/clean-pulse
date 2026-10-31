import React from 'react';

export const APP_ICON_PATH = '/icon-512.png';
export const APP_LOGO_PATH = '/logo-full.png';
export const APP_MARK_PATH = '/logo-mark.png';

interface CleanPulseLogoProps {
  variant?: 'icon' | 'badge' | 'full' | 'hero';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export function CleanPulseLogo({
  variant = 'icon',
  size = 'md',
  className = '',
  showSubtitle = false,
}: CleanPulseLogoProps) {
  // Dimension classes for square app icon
  const iconSizes = {
    xs: 'w-6 h-6 rounded-lg',
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
  };

  if (variant === 'icon') {
    return (
      <div
        className={`relative overflow-hidden shrink-0 border border-emerald-500/30 bg-slate-950 shadow-sm shadow-emerald-500/10 ${iconSizes[size]} ${className}`}
      >
        <img
          src={APP_ICON_PATH}
          alt="CleanPulse App Icon"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div
          className={`relative overflow-hidden shrink-0 border border-emerald-500/30 bg-slate-950 shadow-sm shadow-emerald-500/10 ${iconSizes[size]}`}
        >
          <img
            src={APP_ICON_PATH}
            alt="CleanPulse App Icon"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-100 tracking-tight leading-none text-sm">
              CleanPulse
            </span>
          </div>
          {showSubtitle && (
            <p className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
              smart. fresh. lived.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div
        className={`relative w-full rounded-2xl overflow-hidden border border-emerald-500/20 bg-slate-950 shadow-lg ${className}`}
      >
        <img
          src={APP_LOGO_PATH}
          alt="CleanPulse Official Artwork"
          className="w-full h-auto object-contain max-h-48"
        />
      </div>
    );
  }

  // Full default image
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 ${className}`}>
      <img
        src={APP_LOGO_PATH}
        alt="CleanPulse Logo"
        className="w-full h-auto object-contain"
      />
    </div>
  );
}
