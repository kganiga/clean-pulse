import React from 'react';
import { ScanProgressState } from '../../types';
import { formatBytes, formatNumber, triggerHaptic } from '../../utils/formatters';
import { M3Button, M3ProgressBar } from '../common/MaterialComponents';
import { Loader2, XCircle, Search, Hash, ShieldCheck } from 'lucide-react';

export function ScanProgressScreen({
  progress,
  onCancel,
}: {
  progress: ScanProgressState;
  onCancel: () => void;
}) {
  const getPhaseInfo = () => {
    switch (progress.phase) {
      case 'indexing':
        return {
          title: 'Indexing Storage Items',
          desc: 'Traversing accessible directories and MediaStore tables...',
          icon: <Search className="w-5 h-5 text-emerald-400 animate-pulse" />,
        };
      case 'hashing_duplicates':
        return {
          title: 'Hashing Duplicate Candidates',
          desc: 'Streaming 64KB chunked SHA-256 comparisons on matching file sizes...',
          icon: <Hash className="w-5 h-5 text-cyan-400 animate-spin" />,
        };
      case 'evaluating_policies':
        return {
          title: 'Evaluating Safe Deletion Policies',
          desc: 'Applying age thresholds, Scoped Storage rules, and user safety filters...',
          icon: <ShieldCheck className="w-5 h-5 text-violet-400" />,
        };
      case 'completed':
        return {
          title: 'Scan Finalized',
          desc: 'Compiling storage breakdown and candidate lists...',
          icon: <Loader2 className="w-5 h-5 text-emerald-400" />,
        };
      default:
        return {
          title: 'Scanning Device Storage',
          desc: 'Preparing storage analyzer...',
          icon: <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />,
        };
    }
  };

  const phase = getPhaseInfo();

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      {/* Top Header */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            {phase.icon}
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-100">{phase.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{phase.desc}</p>
          </div>
        </div>

        {/* Progress Bar & Percent */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline text-xs font-mono">
            <span className="text-slate-400">Progress</span>
            <span className="text-emerald-400 font-semibold">
              {Math.round(progress.percent * 100)}%
            </span>
          </div>
          <M3ProgressBar progress={progress.percent} />
        </div>

        {/* Currently Scanned File Path */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Current Target
          </span>
          <p className="text-xs font-mono text-slate-300 truncate" title={progress.currentPath}>
            {progress.currentPath || 'Initializing traversal...'}
          </p>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400">Files Examined</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {formatNumber(progress.filesScanned)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400">Bytes Examined</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {formatBytes(progress.bytesExamined, 1)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400">Duplicates Found</span>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
              {progress.duplicatesFound}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400">Potential Cleanable</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {formatBytes(progress.cleanableFound)}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Action */}
      <div className="pt-6">
        <M3Button
          onClick={() => {
            triggerHaptic('warning');
            onCancel();
          }}
          variant="tonal"
          icon={<XCircle className="w-4 h-4 text-rose-400" />}
          className="w-full text-rose-300 hover:text-rose-200"
        >
          Cancel Storage Scan
        </M3Button>
        <p className="text-[11px] text-slate-500 text-center mt-3">
          Cancellation halts SHA-256 worker without corrupting state
        </p>
      </div>
    </div>
  );
}
