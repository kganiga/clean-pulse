import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { StorageCandidate } from '../../types';
import { formatBytes, triggerHaptic } from '../../utils/formatters';
import { M3Button } from '../common/MaterialComponents';

export function CleanupConfirmModal({
  selectedCandidates,
  onConfirm,
  onCancel,
}: {
  selectedCandidates: StorageCandidate[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const totalBytes = selectedCandidates.reduce((sum, c) => sum + c.size, 0);

  const appCache = selectedCandidates.filter((c) => c.category === 'app_cache');
  const userFiles = selectedCandidates.filter((c) => c.category !== 'app_cache');

  const handleConfirm = () => {
    triggerHaptic('warning');
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[88vh] animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Confirm Deletion</h2>
              <p className="text-xs text-slate-400">Review selected files before permanent removal</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Metric */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">Total Space to Reclaim</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {formatBytes(totalBytes)}
            </span>
          </div>
          <div className="text-right text-xs text-slate-400">
            <span className="font-mono text-slate-200 font-semibold">{selectedCandidates.length}</span>{' '}
            items
          </div>
        </div>

        {/* Affected Files List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px] max-h-[260px]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Exact Affected Files
          </span>

          {selectedCandidates.map((file) => (
            <div
              key={file.id}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="font-mono font-medium text-slate-200 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate" title={file.path}>
                  {file.path}
                </p>
              </div>
              <span className="font-mono text-[11px] text-emerald-400 shrink-0">
                {formatBytes(file.size)}
              </span>
            </div>
          ))}
        </div>

        {/* Safety Assurances */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>CleanPulse Safe Cleanup Engine</span>
          </div>
          <p className="leading-snug">
            Original master copies of duplicates are protected. Destructive removal only affects files
            explicitly checked above.
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-5 space-y-2">
          <M3Button onClick={handleConfirm} variant="danger" className="w-full">
            Permanently Delete ({formatBytes(totalBytes)})
          </M3Button>
          <M3Button onClick={onCancel} variant="tonal" className="w-full">
            Cancel
          </M3Button>
        </div>
      </div>
    </div>
  );
}
