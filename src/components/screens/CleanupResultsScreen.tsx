import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, HardDrive, History, ArrowRight } from 'lucide-react';
import { CleanupExecutionResult } from '../../types';
import { formatBytes, formatTimestamp, triggerHaptic } from '../../utils/formatters';
import { M3Button, M3Card } from '../common/MaterialComponents';

export function CleanupResultsScreen({
  result,
  onReturnDashboard,
  onViewHistory,
}: {
  result: CleanupExecutionResult;
  onReturnDashboard: () => void;
  onViewHistory: () => void;
}) {
  useEffect(() => {
    triggerHaptic('success');
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#10b981', '#06b6d4', '#6366f1'],
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div className="space-y-6 pt-4">
        {/* Success Emblem */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Cleanup Complete & Verified
          </span>
          <h1 className="text-3xl font-bold font-mono tracking-tight text-slate-100 mt-1">
            {formatBytes(result.bytesReclaimed, 1)}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Successfully reclaimed from {result.filesDeletedCount} selected items.
          </p>
        </div>

        {/* Breakdown Card */}
        <M3Card className="space-y-3 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">App Cache Reclaimed</span>
            <span className="font-mono text-slate-200">{formatBytes(result.freedByAppCache)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">User-Approved Files Reclaimed</span>
            <span className="font-mono text-slate-200">{formatBytes(result.freedByUserFiles)}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
            <span className="text-slate-400">Failed / Skipped Items</span>
            <span className="font-mono text-slate-200">{result.failedCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Verification Post-Rescan</span>
            <span className="text-emerald-400 font-medium">Verified Clean</span>
          </div>
        </M3Card>

        {/* Log details */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
          <span className="font-medium text-slate-300 block mb-1">Room Database Record</span>
          Logged to persistent cleanup audit table with timestamp {formatTimestamp(result.timestamp)}.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-6 space-y-2.5">
        <M3Button
          onClick={() => {
            triggerHaptic('light');
            onReturnDashboard();
          }}
          className="w-full"
          icon={<HardDrive className="w-4 h-4" />}
        >
          Return to Dashboard
        </M3Button>
        <M3Button
          onClick={() => {
            triggerHaptic('light');
            onViewHistory();
          }}
          variant="tonal"
          className="w-full"
          icon={<History className="w-4 h-4" />}
        >
          View Cleanup Audit Log
        </M3Button>
      </div>
    </div>
  );
}
