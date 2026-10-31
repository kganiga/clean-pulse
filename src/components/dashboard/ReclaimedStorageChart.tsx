import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { TrendingUp, BarChart3, Activity, Sparkles, Calendar } from 'lucide-react';
import { CleanupHistoryRecord } from '../../types';
import { getDailyCleanupTrend, DailyCleanupPoint } from '../../services/historyStore';
import { formatBytes, triggerHaptic } from '../../utils/formatters';

interface ReclaimedStorageChartProps {
  history: CleanupHistoryRecord[];
  onOpenHistory?: () => void;
}

export function ReclaimedStorageChart({ history, onOpenHistory }: ReclaimedStorageChartProps) {
  const [timeRange, setTimeRange] = useState<30 | 14 | 7>(30);
  const [chartMode, setChartMode] = useState<'bar' | 'area'>('bar');

  // Calculate aggregated data for the selected day range
  const data = useMemo(() => {
    return getDailyCleanupTrend(history, timeRange);
  }, [history, timeRange]);

  // Summary statistics
  const summary = useMemo(() => {
    const totalBytes = data.reduce((acc, pt) => acc + pt.bytesReclaimed, 0);
    const totalItems = data.reduce((acc, pt) => acc + pt.itemsCount, 0);
    const activeDays = data.filter((pt) => pt.bytesReclaimed > 0).length;
    const peakPoint = data.reduce(
      (max, pt) => (pt.bytesReclaimed > max.bytesReclaimed ? pt : max),
      data[0] || { bytesReclaimed: 0 }
    );

    return {
      totalBytes,
      totalItems,
      activeDays,
      peakBytes: peakPoint.bytesReclaimed,
      peakDate: peakPoint.dayLabel,
    };
  }, [data]);

  // Convert bytes to Megabytes for the chart Y-axis scale to keep numeric stability
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      mbReclaimed: Math.round((d.bytesReclaimed / (1024 * 1024)) * 10) / 10,
    }));
  }, [data]);

  // Format tick labels for mobile viewport
  const formatXAxisTick = (tickStr: string, index: number) => {
    if (timeRange === 30) {
      // Show tick every 6-7 days
      return index % 6 === 0 || index === data.length - 1 ? tickStr : '';
    }
    if (timeRange === 14) {
      return index % 3 === 0 || index === data.length - 1 ? tickStr : '';
    }
    return tickStr;
  };

  return (
    <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-slate-200 tracking-tight">
              Storage Reclaimed Trend
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Daily cleanup performance over {timeRange} days
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              triggerHaptic('light');
              setChartMode('bar');
            }}
            title="Bar graph"
            className={`p-1 rounded-md text-[10px] font-medium transition-colors ${
              chartMode === 'bar'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setChartMode('area');
            }}
            title="Trend line"
            className={`p-1 rounded-md text-[10px] font-medium transition-colors ${
              chartMode === 'area'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-950/60 rounded-xl border border-slate-800/70 mb-3.5">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Reclaimed ({timeRange}d)</span>
          <span className="text-sm font-bold font-mono text-emerald-400 block mt-0.5">
            {formatBytes(summary.totalBytes, 1)}
          </span>
        </div>
        <div className="border-l border-slate-800/80 pl-2">
          <span className="text-[10px] text-slate-400 block font-medium">Active Days</span>
          <span className="text-sm font-bold font-mono text-cyan-400 block mt-0.5">
            {summary.activeDays} <span className="text-[10px] text-slate-500 font-normal">days</span>
          </span>
        </div>
        <div className="border-l border-slate-800/80 pl-2">
          <span className="text-[10px] text-slate-400 block font-medium">Peak Cleanup</span>
          <span className="text-sm font-bold font-mono text-slate-200 block mt-0.5">
            {summary.peakBytes > 0 ? formatBytes(summary.peakBytes, 0) : '0 B'}
          </span>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="w-full h-36 min-w-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'bar' ? (
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 4, left: -26, bottom: 0 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#1e293b"
                opacity={0.5}
              />
              <XAxis
                dataKey="dayLabel"
                stroke="#64748b"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={formatXAxisTick}
                dy={3}
              />
              <YAxis
                stroke="#64748b"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (val === 0) return '0';
                  if (val >= 1024) return `${(val / 1024).toFixed(1)}G`;
                  return `${Math.round(val)}M`;
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(51, 65, 85, 0.25)', radius: 4 }}
              />
              <Bar dataKey="mbReclaimed" radius={[3, 3, 0, 0]} maxBarSize={16}>
                {chartData.map((entry, index) => {
                  const hasData = entry.bytesReclaimed > 0;
                  return (
                    <Cell
                      key={`bar-${index}`}
                      fill={hasData ? 'url(#barGradient)' : '#1e293b'}
                      opacity={hasData ? 1 : 0.3}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 4, left: -26, bottom: 0 }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#1e293b"
                opacity={0.5}
              />
              <XAxis
                dataKey="dayLabel"
                stroke="#64748b"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={formatXAxisTick}
                dy={3}
              />
              <YAxis
                stroke="#64748b"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (val === 0) return '0';
                  if (val >= 1024) return `${(val / 1024).toFixed(1)}G`;
                  return `${Math.round(val)}M`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="mbReclaimed"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#areaGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#34d399',
                  stroke: '#0f172a',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer controls: Time Range Selector & Detailed History Link */}
      <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-800/70 text-[11px]">
        {/* Days range buttons */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Span:
          </span>
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              onClick={() => {
                triggerHaptic('light');
                setTimeRange(days);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                timeRange === days
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>

        {onOpenHistory && (
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenHistory();
            }}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Full History</span>
            <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Custom Material 3 Tooltip for Recharts
 */
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as DailyCleanupPoint & { mbReclaimed: number };
    const hasReclaimed = data.bytesReclaimed > 0;

    return (
      <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-[11px] min-w-[130px] pointer-events-none z-50">
        <div className="text-slate-400 font-medium text-[10px] flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
          <span>{data.dayLabel}</span>
          <span className="text-slate-500 text-[9px]">{data.dateKey}</span>
        </div>

        {hasReclaimed ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Reclaimed:</span>
              <span className="font-mono font-bold text-emerald-400">
                {formatBytes(data.bytesReclaimed)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-slate-500">Files cleaned:</span>
              <span className="text-slate-300 font-medium">{data.itemsCount} items</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-slate-500">Cleanups run:</span>
              <span className="text-slate-300 font-medium">{data.cleanupsCount}</span>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 italic text-[10px] py-0.5">
            No cleanup recorded
          </div>
        )}
      </div>
    );
  }
  return null;
}
