import React from 'react';
import {
  Copy,
  Clock,
  Package,
  FileText,
  FolderOpen,
  Layers,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  FileCode,
} from 'lucide-react';
import { StorageBreakdown, StorageCandidate, FileCategory } from '../../types';
import { formatBytes, triggerHaptic } from '../../utils/formatters';
import { M3Button, M3Card } from '../common/MaterialComponents';

export function ScanResultsScreen({
  breakdown,
  candidates,
  onToggleCategory,
  onSelectCategoryForReview,
  onProceedToClean,
  onBack,
}: {
  breakdown: StorageBreakdown;
  candidates: StorageCandidate[];
  onToggleCategory: (category: FileCategory, selectAll: boolean) => void;
  onSelectCategoryForReview: (category: FileCategory) => void;
  onProceedToClean: () => void;
  onBack: () => void;
}) {
  const selectedCandidates = candidates.filter((c) => c.selected);
  const selectedBytes = selectedCandidates.reduce((acc, c) => acc + c.size, 0);

  const getCategoryStatus = (category: FileCategory) => {
    const items = candidates.filter((c) => c.category === category);
    const selected = items.filter((c) => c.selected);
    const allSelected = items.length > 0 && selected.length === items.length;
    const someSelected = selected.length > 0 && !allSelected;
    const totalBytes = items.reduce((sum, i) => sum + i.size, 0);

    return {
      items,
      count: items.length,
      selectedCount: selected.length,
      allSelected,
      someSelected,
      totalBytes,
    };
  };

  const categories: {
    key: FileCategory;
    name: string;
    icon: React.ReactNode;
    desc: string;
    isSafeByDefault: boolean;
  }[] = [
    {
      key: 'app_cache',
      name: 'CleanPulse Cache',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      desc: 'Internal app cache files. Rebuilt on demand.',
      isSafeByDefault: true,
    },
    {
      key: 'tmp_files',
      name: 'Temporary Files (.tmp)',
      icon: <FileCode className="w-4 h-4 text-amber-400" />,
      desc: 'Stale video rendering buffers, camera .tmp caches, and export scratch files.',
      isSafeByDefault: true,
    },
    {
      key: 'temp_files',
      name: 'Residual & Log Files',
      icon: <FileText className="w-4 h-4 text-violet-400" />,
      desc: 'Orphaned crash trace logs, partial downloads, and expired app scratch files.',
      isSafeByDefault: true,
    },
    {
      key: 'app_apks',
      name: 'Leftover APK Installers',
      icon: <Package className="w-4 h-4 text-emerald-400" />,
      desc: 'Downloaded installation packages no longer needed after install.',
      isSafeByDefault: true,
    },
    {
      key: 'duplicates',
      name: 'Duplicate Copies (SHA-256)',
      icon: <Copy className="w-4 h-4 text-cyan-400" />,
      desc: 'Exact byte duplicates. Original files are protected and kept safe.',
      isSafeByDefault: true,
    },
    {
      key: 'old_downloads',
      name: 'Old Downloads (>60 Days)',
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      desc: 'Files in Downloads folder unaccessed for over 2 months.',
      isSafeByDefault: false,
    },
    {
      key: 'empty_dirs',
      name: 'Empty Directories',
      icon: <FolderOpen className="w-4 h-4 text-slate-400" />,
      desc: 'Zero-byte empty folder structures left by deleted apps.',
      isSafeByDefault: true,
    },
    {
      key: 'large_files',
      name: 'Large Media Files (>25MB)',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
      desc: 'Videos, recordings, and offline maps. For manual review only.',
      isSafeByDefault: false,
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between pb-6">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-400 hover:text-slate-200 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-slate-100">Scan Results</h1>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            {formatBytes(breakdown.cleanableBytes)} found
          </span>
        </div>

        {/* Selected Summary Card */}
        <div className="p-5">
          <M3Card className="bg-slate-900 border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Ready for Safe Cleanup</span>
              <span className="font-mono text-slate-200">{selectedCandidates.length} files selected</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {formatBytes(selectedBytes)}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              CleanPulse never deletes personal photos, videos, or WhatsApp files without explicit selection.
            </p>
          </M3Card>
        </div>

        {/* Categories List */}
        <div className="px-5 space-y-2.5 pb-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Categories & Selection
          </h2>

          {categories.map((cat) => {
            const status = getCategoryStatus(cat.key);
            if (status.count === 0) return null;

            return (
              <div
                key={cat.key}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    onClick={() => onSelectCategoryForReview(cat.key)}
                    className="flex-1 cursor-pointer flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      {cat.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">{cat.name}</span>
                        {!cat.isSafeByDefault && (
                          <span className="text-[10px] text-amber-400/90 flex items-center gap-0.5">
                            <ShieldAlert className="w-3 h-3" /> Review
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{cat.desc}</p>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-2">
                        <span>{status.count} items</span>
                        <span>·</span>
                        <span className="text-emerald-400">{formatBytes(status.totalBytes)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkbox for batch toggle */}
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onToggleCategory(cat.key, !status.allSelected);
                      }}
                      className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                        status.allSelected
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold'
                          : status.someSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'border-slate-700 bg-slate-800 text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => onSelectCategoryForReview(cat.key)}
                      className="p-1 text-slate-500 hover:text-slate-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md shrink-0">
        <M3Button
          onClick={() => {
            triggerHaptic('medium');
            onProceedToClean();
          }}
          disabled={selectedBytes === 0}
          className="w-full h-11 text-xs font-semibold"
        >
          Proceed to Clean ({formatBytes(selectedBytes, 1)})
        </M3Button>
      </div>
    </div>
  );
}
