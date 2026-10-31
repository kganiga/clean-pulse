import React, { useState } from 'react';
import {
  Sparkles,
  Archive,
  Trash2,
  Clock,
  ChevronRight,
  FileText,
  Video,
  Package,
  CheckCircle2,
  FileArchive,
  ExternalLink,
  ShieldAlert,
  X,
  Download,
  AlertCircle,
} from 'lucide-react';
import { StorageCandidate, SmartSuggestion, SmartSuggestSummary } from '../../types';
import { generateSmartSuggestions, createSmartArchiveZip } from '../../services/smartSuggestEngine';
import { formatBytes, triggerHaptic } from '../../utils/formatters';
import { M3Button } from '../common/MaterialComponents';

interface SmartSuggestCardProps {
  candidates: StorageCandidate[];
  onDeleteCandidates: (ids: string[]) => void;
  onArchiveCandidates?: (archivedFiles: SmartSuggestion[], zipFileName: string) => void;
}

export function SmartSuggestCard({
  candidates,
  onDeleteCandidates,
  onArchiveCandidates,
}: SmartSuggestCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'archive' | 'delete'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveSuccessMessage, setArchiveSuccessMessage] = useState<string | null>(null);

  // Compute smart suggestions
  const summary: SmartSuggestSummary = React.useMemo(() => {
    return generateSmartSuggestions(candidates);
  }, [candidates]);

  // Synchronize default selections when modal opens or suggestions update
  React.useEffect(() => {
    if (summary.suggestions.length > 0) {
      setSelectedIds(new Set(summary.suggestions.map((s) => s.candidateId)));
    }
  }, [summary.suggestions]);

  // If no files match the >90 days dormancy criteria, hide or show clean status
  if (summary.totalDormantFiles === 0) {
    return null;
  }

  const topSuggestions = summary.suggestions.slice(0, 3);

  const filteredSuggestions = summary.suggestions.filter((item) => {
    if (activeFilter === 'archive') return item.suggestedAction === 'ARCHIVE';
    if (activeFilter === 'delete') return item.suggestedAction === 'DELETE';
    return true;
  });

  const selectedSuggestions = summary.suggestions.filter((s) => selectedIds.has(s.candidateId));
  const selectedArchiveItems = selectedSuggestions.filter((s) => s.suggestedAction === 'ARCHIVE');
  const selectedDeleteItems = selectedSuggestions.filter((s) => s.suggestedAction === 'DELETE');
  const selectedBytes = selectedSuggestions.reduce((acc, s) => acc + s.size, 0);

  const toggleSelect = (id: string) => {
    triggerHaptic('light');
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    triggerHaptic('light');
    if (selectedIds.size === filteredSuggestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSuggestions.map((s) => s.candidateId)));
    }
  };

  // Perform Real ZIP Archival via JSZip
  const handleExecuteArchive = async () => {
    if (selectedArchiveItems.length === 0) return;
    try {
      setIsArchiving(true);
      triggerHaptic('medium');
      const timestampStr = new Date().toISOString().slice(0, 10);
      const zipName = `CleanPulse_Dormant_Archive_${timestampStr}.zip`;

      const result = await createSmartArchiveZip(selectedArchiveItems, zipName);

      // Trigger browser download for real user accessibility
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Notify parent to remove archived files from device storage candidates
      const archivedIds = selectedArchiveItems.map((s) => s.candidateId);
      onDeleteCandidates(archivedIds);

      if (onArchiveCandidates) {
        onArchiveCandidates(selectedArchiveItems, result.fileName);
      }

      setArchiveSuccessMessage(
        `Archived ${selectedArchiveItems.length} files (${formatBytes(result.totalBytesCompressed)}) into ${result.fileName}`
      );
      triggerHaptic('success');
      setTimeout(() => {
        setArchiveSuccessMessage(null);
        if (selectedDeleteItems.length === 0) {
          setIsModalOpen(false);
        }
      }, 2500);
    } catch {
      // Archive error handling
    } finally {
      setIsArchiving(false);
    }
  };

  // Perform Deletion of selected obsolete dormant files
  const handleExecuteDelete = () => {
    if (selectedDeleteItems.length === 0) return;
    triggerHaptic('medium');
    const deleteIds = selectedDeleteItems.map((s) => s.candidateId);
    onDeleteCandidates(deleteIds);
    if (selectedArchiveItems.length === 0) {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      {/* Dedicated Material 3 Smart Suggest Dashboard Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/30 p-4 shadow-md relative overflow-hidden group">
        {/* Subtle ambient accent glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-100 tracking-tight">Smart Suggest</h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  &gt;90d Dormant
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Unopened files ready for archival or deletion
              </p>
            </div>
          </div>

          <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-800/60 shrink-0">
            {formatBytes(summary.totalDormantBytes)}
          </span>
        </div>

        {/* Recommendation Metrics Pills */}
        <div className="grid grid-cols-2 gap-2 my-3">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-indigo-900/40">
            <div className="flex items-center gap-1.5 text-[10px] text-indigo-300 font-medium">
              <Archive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Suggest Archive (ZIP)</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-sm font-bold font-mono text-slate-200">
                {formatBytes(summary.archiveSuggestedBytes)}
              </span>
              <span className="text-[10px] text-slate-500">({summary.archiveCount} docs/media)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-rose-900/30">
            <div className="flex items-center gap-1.5 text-[10px] text-rose-300 font-medium">
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Suggest Deletion</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-sm font-bold font-mono text-slate-200">
                {formatBytes(summary.deleteSuggestedBytes)}
              </span>
              <span className="text-[10px] text-slate-500">({summary.deleteCount} APKs/logs)</span>
            </div>
          </div>
        </div>

        {/* Top Preview Files List */}
        <div className="space-y-1.5 mb-3 bg-slate-950/40 rounded-xl p-2 border border-slate-800/80">
          {topSuggestions.map((item) => (
            <div
              key={item.candidateId}
              className="flex items-center justify-between text-xs py-1 px-1.5 hover:bg-slate-900/80 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <FileIcon mimeType={item.mimeType} name={item.name} />
                <div className="min-w-0">
                  <span className="text-slate-300 text-[11px] font-medium block truncate max-w-[150px] sm:max-w-[180px]">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {item.daysDormant} days unopened · {formatBytes(item.size)}
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ${
                  item.suggestedAction === 'ARCHIVE'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {item.suggestedAction === 'ARCHIVE' ? 'Archive (ZIP)' : 'Delete'}
              </span>
            </div>
          ))}
        </div>

        {/* Primary Action Button */}
        <M3Button
          onClick={() => {
            triggerHaptic('light');
            setIsModalOpen(true);
          }}
          variant="filled"
          className="w-full h-10 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <span>Review & Action ({summary.totalDormantFiles} Dormant Files)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </M3Button>
      </div>

      {/* Interactive Smart Suggest Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">Smart Suggest Review</h2>
                  <p className="text-[11px] text-slate-400">Files inactive for over 90 days</p>
                </div>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsModalOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success notification banner if archive generated */}
            {archiveSuccessMessage && (
              <div className="mx-4 mt-3 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs animate-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{archiveSuccessMessage}</span>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({summary.totalDormantFiles})
              </button>
              <button
                onClick={() => setActiveFilter('archive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFilter === 'archive'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Archive ({summary.archiveCount})
              </button>
              <button
                onClick={() => setActiveFilter('delete')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFilter === 'delete'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Delete ({summary.deleteCount})
              </button>

              <button
                onClick={handleToggleAll}
                className="ml-auto text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {selectedIds.size === filteredSuggestions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Suggestions Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
              {filteredSuggestions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No dormant files matching this filter.
                </div>
              ) : (
                filteredSuggestions.map((item) => {
                  const isSelected = selectedIds.has(item.candidateId);
                  return (
                    <div
                      key={item.candidateId}
                      onClick={() => toggleSelect(item.candidateId)}
                      className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-850 border-indigo-500/40 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-800"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {item.name}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-200 shrink-0">
                              {formatBytes(item.size)}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {item.path}
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{item.daysDormant} days inactive</span>
                            </div>

                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                item.suggestedAction === 'ARCHIVE'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {item.suggestedAction === 'ARCHIVE'
                                ? '📦 Recommend Archival'
                                : '🗑️ Recommend Deletion'}
                            </span>
                          </div>

                          <p className="mt-1 text-[10px] text-slate-400 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80">
                            {item.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Selected: {selectedSuggestions.length} items</span>
                <span className="font-mono font-bold text-slate-200">
                  {formatBytes(selectedBytes)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Archive Button */}
                <M3Button
                  onClick={handleExecuteArchive}
                  disabled={selectedArchiveItems.length === 0 || isArchiving}
                  variant="tonal"
                  icon={<FileArchive className="w-4 h-4 text-indigo-400" />}
                  className="h-10 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 disabled:opacity-50"
                >
                  {isArchiving
                    ? 'Creating ZIP...'
                    : `Archive (${selectedArchiveItems.length})`}
                </M3Button>

                {/* Delete Button */}
                <M3Button
                  onClick={handleExecuteDelete}
                  disabled={selectedDeleteItems.length === 0}
                  variant="filled"
                  icon={<Trash2 className="w-4 h-4" />}
                  className="h-10 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50"
                >
                  Delete ({selectedDeleteItems.length})
                </M3Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FileIcon({ mimeType, name }: { mimeType: string; name: string }) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.mov') || mimeType.startsWith('video/')) {
    return <Video className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  }
  if (lower.endsWith('.apk')) {
    return <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }
  if (lower.endsWith('.zip') || lower.endsWith('.rar')) {
    return <FileArchive className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }
  return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}
