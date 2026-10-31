import React, { useState, useEffect } from 'react';
import {
  Wifi,
  BatteryMedium,
  Smartphone,
  Tablet,
  Code,
  ShieldCheck,
  Sun,
  Moon,
  HardDrive,
  Layers,
  Info,
  Activity,
  Settings,
} from 'lucide-react';
import { M3BottomNav } from '../common/MaterialComponents';
import { CleanPulseLogo } from '../common/CleanPulseLogo';
import { triggerHaptic } from '../../utils/formatters';

export function PhoneFrame({
  children,
  batteryLevel = 84,
  isCharging = false,
  isExpanded = false,
  onToggleExpanded,
  theme = 'dark',
  onToggleTheme,
  activeView,
  onViewChange,
  activeTab,
  onSelectTab,
  showBottomNav = true,
}: {
  children: React.ReactNode;
  batteryLevel?: number;
  isCharging?: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  activeView: 'phone' | 'project';
  onViewChange: (view: 'phone' | 'project') => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  showBottomNav?: boolean;
}) {
  const [time, setTime] = useState('10:19');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const navTabs = [
    { id: 'dashboard', label: 'Storage', icon: <HardDrive className="w-5 h-5" /> },
    { id: 'review', label: 'Files', icon: <Layers className="w-5 h-5" /> },
    { id: 'impact', label: 'Impact', icon: <Info className="w-5 h-5" /> },
    { id: 'health', label: 'Health', icon: <Activity className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Application Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-2.5 shrink-0 flex items-center justify-between gap-3">
        {/* Zone 1: Wordmark & Official App Icon */}
        <div className="flex items-center gap-2.5">
          <CleanPulseLogo size="md" variant="icon" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100 tracking-tight">CleanPulse</span>
              <span className="text-[10px] text-emerald-400 font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 hidden sm:inline">
                smart. fresh. lived.
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (App vs Project) */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => {
              triggerHaptic('light');
              onViewChange('phone');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeView === 'phone'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App Interface</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              onViewChange('project');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeView === 'project'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Android Studio Project</span>
          </button>
        </div>

        {/* Zone 3: Viewport & Theme controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeView === 'phone' && onToggleExpanded && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onToggleExpanded();
              }}
              title={isExpanded ? 'Switch to Compact Phone Frame' : 'Switch to Expanded View'}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-xs"
            >
              {isExpanded ? <Smartphone className="w-4 h-4" /> : <Tablet className="w-4 h-4" />}
              <span className="text-[11px] text-slate-400">{isExpanded ? 'Compact' : 'Expanded'}</span>
            </button>
          )}

          {onToggleTheme && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onToggleTheme();
              }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        {activeView === 'project' ? (
          <div className="w-full max-w-7xl h-[86vh] flex flex-col">{children}</div>
        ) : (
          /* Android Frame Container */
          <div
            className={`w-full ${
              isExpanded ? 'max-w-2xl' : 'max-w-[420px]'
            } transition-all duration-300 mx-auto h-[86vh] flex flex-col`}
          >
            <div className="relative rounded-[36px] border-[5px] border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col h-full">
              {/* Android Status Bar */}
              <div className="h-8 px-5 bg-slate-900 flex items-center justify-between text-xs font-medium text-slate-400 shrink-0 border-b border-slate-800/40">
                <span className="font-mono text-[11px] tracking-tight">{time}</span>
                {/* Camera punch hole */}
                <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-800 mx-auto" />
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px]">{batteryLevel}%</span>
                  <BatteryMedium className={`w-3.5 h-3.5 ${isCharging ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
              </div>

              {/* Scrollable Screen Content */}
              <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 flex flex-col">
                {children}
              </div>

              {/* Material 3 Bottom Navigation Bar */}
              {showBottomNav && (
                <M3BottomNav
                  tabs={navTabs}
                  activeTab={activeTab}
                  onSelectTab={(tabId) => {
                    triggerHaptic('light');
                    onSelectTab(tabId);
                  }}
                />
              )}

              {/* Android Bottom Gesture Bar */}
              <div className="h-3.5 bg-slate-900 flex items-center justify-center shrink-0">
                <div className="w-28 h-1 bg-slate-600 rounded-full opacity-60" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
