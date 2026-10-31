import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Filter,
  CheckSquare,
  Square,
  ShieldCheck,
  FileText,
  Copy,
  Package,
  Layers,
  Clock,
  FolderOpen,
} from 'lucide-react';
import { StorageCandidate, FileCategory, DuplicateGroup } from '../../types';
import { formatBytes, formatTimestamp, triggerHaptic } from '../../utils/formatters';
import { M3Button, M3Card } from '../common/MaterialComponents';
import { DuplicateGroupViewer } from '../duplicate/DuplicateGroupViewer';

export function FileReviewScreen({
  candidates,
  initialCategory = 'all',
  duplicateGroups = [],
  onToggleCandidate,
  onBatchToggle,
  onToggleDuplicateMember,
  onSetKeepMember,
  onProceedToClean,
  onBack,
}: {
  candidates: StorageCandidate[];
  initialCategory?: string;
  duplicateGroups?: DuplicateGroup[];
  onToggleCandidate: (id: string) => void;
  onBatchToggle: (ids: string[], select: boolean) => void;
  onToggleDuplicateMember?: (groupId: string, memberId: string) => void;
  onSetKeepMember?: (groupId: string, memberId: string) => void;
  onProceedToClean: () => void;
  onBack: () => void;
}) {
  const [selectedFilter, setSelectedFilter] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'size_desc' | 'date_desc' | 'name_asc'>('size_desc');
  const [dupViewMode, setDupViewMode] = useState<'grouped' | 'list'>('grouped');

  // Filter candidates
  const filtered = useMemo(() => {
    return candidates.filter((item) => {
      if (selectedFilter !== 'all' && item.category !== selectedFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.path.toLowerCase().includes(q) ||
          item.flagReason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [candidates, selectedFilter, searchQuery]);

  // Sort candidates
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'size_desc') return b.size - a.size;
      if (sortBy === 'date_desc') return b.lastModified - a.lastModified;
      return a.name.localeCompare(b.name);
    });
  }, [filtered, sortBy]);

  const selectedInView = sorted.filter((c) => c.selected && !c.isOriginal);
  const allInViewSelected =
    sorted.length > 0 && selectedInView.length === sorted.filter((c) => !c.isOriginal).length;

  const totalSelectedBytes = candidates
    .filter((c) => c.selected)
    .reduce((sum, c) => sum + c.size, 0);

  const filterTabs = [
    { id: 'all', label: 'All Candidates' },
    { id: 'duplicates', label: 'Duplicates' },
    { id: 'tmp_files', label: 'Temp (.tmp)' },
    { id: 'temp_files', label: 'Logs & Partials' },
    { id: 'old_downloads', label: 'Old Downloads' },
    { id: 'app_apks', label: 'APKs' },
    { id: 'large_files', label: 'Large Files' },
    { id: 'empty_dirs', label: 'Empty Dirs' },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Top Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-400 hover:text-slate-200 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-100">Review Candidates</h1>
              <p className="text-[11px] text-slate-400">{sorted.length} items shown</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              const eligibleIds = sorted.filter((c) => !c.isOriginal).map((c) => c.id);
              onBatchToggle(eligibleIds, !allInViewSelected);
            }}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            {allInViewSelected ? 'Deselect View' : 'Select All View'}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by filename or path..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Tabs (Horizontal Scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setSelectedFilter(tab.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedFilter === tab.id
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-toggle for Duplicates view mode */}
        {selectedFilter === 'duplicates' && (
          <div className="mt-2.5 flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => {
                triggerHaptic('light');
                setDupViewMode('grouped');
              }}
              className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                dupViewMode === 'grouped'
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Grouped Sets (SHA-256)
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setDupViewMode('list');
              }}
              className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                dupViewMode === 'list'
                  ? 'bg-slate-800 text-slate-200 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Flat File List
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {selectedFilter === 'duplicates' && dupViewMode === 'grouped' ? (
        <DuplicateGroupViewer
          groups={duplicateGroups}
          onToggleMemberSelection={(groupId, memberId) => {
            onToggleDuplicateMember?.(groupId, memberId);
          }}
          onSetKeepMember={(groupId, memberId) => {
            onSetKeepMember?.(groupId, memberId);
          }}
          onCleanSelectedDuplicates={onProceedToClean}
        />
      ) : (
        /* Candidate Files List */
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No files match your current filters.
            </div>
          ) : (
            sorted.map((item) => {
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-colors ${
                  item.selected
                    ? 'bg-slate-900/90 border-emerald-500/40'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* File Checkbox / Protection status */}
                  <div className="pt-0.5">
                    {item.isOriginal ? (
                      <div
                        title="Original master copy protected from deletion"
                        className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold"
                      >
                        ✓
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          onToggleCandidate(item.id);
                        }}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          item.selected
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold text-xs'
                            : 'border-slate-700 bg-slate-800 text-transparent'
                        }`}
                      >
                        ✓
                      </button>
                    )}
                  </div>

                  {/* File Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-200 truncate font-mono" title={item.name}>
                        {item.name}
                      </span>
                      <span className="text-xs font-mono font-medium text-emerald-400 shrink-0">
                        {formatBytes(item.size)}
                      </span>
                    </div>

                    {/* Unboxed Metadata with · separator */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>{item.category.replace('_', ' ')}</span>
                      <span>·</span>
                      <span>{formatTimestamp(item.lastModified)}</span>
                    </div>

                    {/* Path */}
                    <div className="text-[10px] text-slate-400 font-mono truncate mt-1" title={item.path}>
                      {item.path}
                    </div>

                    {/* Flag Reason / Duplicate info */}
                    <div className="mt-2 text-[11px] text-slate-400 leading-snug">
                      {item.isOriginal ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Original Master Copy · Safe
                        </span>
                      ) : (
                        <span>{item.flagReason}</span>
                      )}
                    </div>

                    {item.sha256 && (
                      <div className="mt-1 text-[10px] font-mono text-cyan-400 truncate" title={item.sha256}>
                        SHA-256: {item.sha256.substring(0, 16)}...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
      )}

      {/* Compact Bottom Action Bar */}
      <div className="py-2.5 px-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md shrink-0 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 block uppercase tracking-wide">Selected</span>
          <span className="text-sm font-bold font-mono text-emerald-400">
            {formatBytes(totalSelectedBytes)}
          </span>
        </div>
        <M3Button
          onClick={() => {
            triggerHaptic('medium');
            onProceedToClean();
          }}
          disabled={totalSelectedBytes === 0}
          className="h-10 px-4 text-xs font-semibold"
        >
          Clean Selected
        </M3Button>
      </div>
    </div>
  );
}
