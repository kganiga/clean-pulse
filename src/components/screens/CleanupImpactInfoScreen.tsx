import React, { useState } from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  Package,
  FileText,
  Clock,
  Layers,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileCode,
} from 'lucide-react';
import { StorageCandidate, StorageBreakdown, FileCategory } from '../../types';
import { formatBytes, triggerHaptic } from '../../utils/formatters';
import { M3Button, M3Card } from '../common/MaterialComponents';

interface CategoryImpactGuide {
  category: FileCategory;
  title: string;
  safetyLevel: 'SAFE' | 'LOW_RISK' | 'USER_REVIEW';
  whyFlagged: string;
  systemImpact: string;
  recreationBehavior: string;
  recommendedAction: string;
  icon: React.ReactNode;
}

export function CleanupImpactInfoScreen({
  candidates,
  breakdown,
  onOpenReviewCategory,
  onCleanSafeItems,
}: {
  candidates: StorageCandidate[];
  breakdown: StorageBreakdown;
  onOpenReviewCategory: (category: FileCategory) => void;
  onCleanSafeItems: () => void;
}) {
  const [expandedCategory, setExpandedCategory] = useState<FileCategory | null>(null);

  const guides: CategoryImpactGuide[] = [
    {
      category: 'app_cache',
      title: 'App Internal Cache',
      safetyLevel: 'SAFE',
      whyFlagged:
        'Volatile thumbnail disk caches and cached HTTP response headers generated during app operation.',
      systemImpact:
        'Zero negative impact. Reclaims disk blocks immediately. CleanPulse and client network libraries simply re-cache data when required.',
      recreationBehavior: 'Recreated automatically by the app upon next launch or media view.',
      recommendedAction: 'Always safe to delete. Recommended for scheduled auto-cleanup.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    },
    {
      category: 'duplicates',
      title: 'Duplicate Files (Identical SHA-256)',
      safetyLevel: 'SAFE',
      whyFlagged:
        'Identified using two-tier verification: exact byte size match followed by chunked SHA-256 cryptographic hash match.',
      systemImpact:
        'CleanPulse strictly retains the original earliest master copy (in DCIM or Documents). Only redundant duplicate copies are removed.',
      recreationBehavior:
        'The content remains safe and accessible on your device through the master copy.',
      recommendedAction:
        'Safe to delete duplicate copies. CleanPulse prevents deleting the original file.',
      icon: <Copy className="w-5 h-5 text-cyan-400" />,
    },
    {
      category: 'tmp_files',
      title: 'Temporary Files (.tmp)',
      safetyLevel: 'SAFE',
      whyFlagged:
        'Stale temporary buffer files (.tmp, .temp) left behind by video editing tools, burst camera processing, and interrupted media rendering.',
      systemImpact:
        'Zero negative impact. CleanPulse strictly targets inactive .tmp files with closed file handles. Does not disrupt active exports or unsaved projects.',
      recreationBehavior:
        'Apps create new temporary files with fresh identifiers when starting new operations; old buffers are never reused.',
      recommendedAction:
        'Highly recommended for scheduled automated maintenance and one-tap cleanup.',
      icon: <FileCode className="w-5 h-5 text-amber-400" />,
    },
    {
      category: 'temp_files',
      title: 'Residual & Log Files (.log, partial downloads)',
      safetyLevel: 'SAFE',
      whyFlagged:
        'Orphaned crash trace logs (.log), interrupted partial downloads (.crdownload, .part), and expired OS trash preview items.',
      systemImpact:
        'Zero impact on active applications. Frees disk space and cleans up orphaned files left by uninstalled apps.',
      recreationBehavior:
        'Will not be recreated unless an app encounters an unhandled crash or a new download is started.',
      recommendedAction:
        'Safe to delete. Frees high-priority flash storage and directory inode slots.',
      icon: <FileText className="w-5 h-5 text-violet-400" />,
    },
    {
      category: 'app_apks',
      title: 'Old APK Installers',
      safetyLevel: 'LOW_RISK',
      whyFlagged:
        'Standalone Android package archive (.apk) files remaining in the Download directory after manual installation.',
      systemImpact:
        'Once an app is installed on your Android device, the installation APK file is completely redundant. Deleting it does NOT uninstall or affect the app.',
      recreationBehavior: 'Will not be recreated. If you ever need to reinstall, you would download a fresh version.',
      recommendedAction:
        'Safe to remove once the corresponding app is successfully installed.',
      icon: <Package className="w-5 h-5 text-emerald-400" />,
    },
    {
      category: 'empty_dirs',
      title: 'Empty Directories',
      safetyLevel: 'SAFE',
      whyFlagged:
        'Directory nodes containing 0 files and 0 subdirectories, typically left behind after deleting apps or clearing media folders.',
      systemImpact:
        'Does not free measurable storage bytes (0 B), but cleans up clutter in file managers and speeds up directory indexing.',
      recreationBehavior: 'Apps will recreate the folder automatically if they ever write to it again.',
      recommendedAction: 'Safe to clean structure.',
      icon: <FolderOpen className="w-5 h-5 text-slate-400" />,
    },
    {
      category: 'old_downloads',
      title: 'Old Downloads (>60 Days)',
      safetyLevel: 'USER_REVIEW',
      whyFlagged:
        'PDFs, documents, and archives downloaded over 60 days ago that have not been modified or opened recently.',
      systemImpact:
        'May contain personal tickets, invoices, or work documents. Deleting removes the file permanently.',
      recreationBehavior: 'Cannot be recovered unless re-downloaded from the original web source.',
      recommendedAction:
        'Requires user review. Inspect filename and date before selecting for deletion.',
      icon: <Clock className="w-5 h-5 text-amber-400" />,
    },
    {
      category: 'large_files',
      title: 'Large Media Files (>25 MB)',
      safetyLevel: 'USER_REVIEW',
      whyFlagged:
        'High-resolution 4K video recordings, screen captures, podcasts, or offline map packages exceeding 25 MB.',
      systemImpact:
        'Highest potential storage reclamation (often gigabytes). However, these are personal files and NOT system junk.',
      recreationBehavior: 'Personal camera videos and recordings are irreplaceable without external backups.',
      recommendedAction:
        'Never auto-deleted. Review each item manually to decide if you want to keep or delete.',
      icon: <Layers className="w-5 h-5 text-blue-400" />,
    },
  ];

  const safeToCleanTotal = candidates
    .filter((c) => c.isSafeToDelete && !c.isOriginal && c.category !== 'large_files' && c.category !== 'old_downloads')
    .reduce((sum, c) => sum + c.size, 0);

  const reviewNeededTotal = candidates
    .filter((c) => c.category === 'large_files' || c.category === 'old_downloads')
    .reduce((sum, c) => sum + c.size, 0);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pb-6">
      {/* Top Header */}
      <div className="px-5 py-3.5 border-b border-slate-800/60 bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-100">Cleanup Guide & Impact</h1>
            <p className="text-[11px] text-slate-400">Which files are ready to clean and why</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Readiness Overview Summary Card */}
        <M3Card className="bg-gradient-to-b from-slate-900 to-slate-900/90 border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Cleanup Readiness
            </span>
            <span className="text-[11px] text-emerald-400 font-mono font-medium">
              Verified Rules
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 font-medium block">
                Ready for Immediate Safe Clean
              </span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                {formatBytes(safeToCleanTotal)}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block leading-tight">
                App caches, verified duplicates & temp logs
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/30">
              <span className="text-[10px] text-amber-400 font-medium block">
                Requires User Review
              </span>
              <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                {formatBytes(reviewNeededTotal)}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block leading-tight">
                Old downloads & large personal media
              </span>
            </div>
          </div>

          {/* Quick Clean Safe CTA */}
          {safeToCleanTotal > 0 && (
            <div className="pt-2">
              <M3Button
                onClick={() => {
                  triggerHaptic('medium');
                  onCleanSafeItems();
                }}
                variant="filled"
                className="w-full text-xs h-11"
                icon={<Sparkles className="w-4 h-4" />}
              >
                Clean Safe Files Now ({formatBytes(safeToCleanTotal)})
              </M3Button>
            </div>
          )}
        </M3Card>

        {/* Detailed Breakdown for Each File Category */}
        <div className="space-y-3">
          <div className="px-1">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Category Technical Impact Analysis
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tap any category to inspect why it was flagged, what deleting it does, and see matching files.
            </p>
          </div>

          <div className="space-y-2.5">
            {guides.map((item) => {
              const matchingCandidates = candidates.filter((c) => c.category === item.category);
              const totalBytes = matchingCandidates.reduce((sum, c) => sum + c.size, 0);
              const isExpanded = expandedCategory === item.category;

              return (
                <div
                  key={item.category}
                  className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden transition-all duration-200"
                >
                  {/* Category Header Row */}
                  <div
                    onClick={() => {
                      triggerHaptic('light');
                      setExpandedCategory(isExpanded ? null : item.category);
                    }}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200 truncate">
                            {item.title}
                          </span>
                          {item.safetyLevel === 'SAFE' && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-medium border border-emerald-500/20">
                              Safe
                            </span>
                          )}
                          {item.safetyLevel === 'LOW_RISK' && (
                            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded font-medium border border-cyan-500/20">
                              Low Risk
                            </span>
                          )}
                          {item.safetyLevel === 'USER_REVIEW' && (
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-medium border border-amber-500/20">
                              Review
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {matchingCandidates.length} files found · {formatBytes(totalBytes)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Technical Explanation & File List */}
                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-slate-800/80 bg-slate-950/60 space-y-3 text-xs text-slate-300">
                      {/* Why Flagged */}
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-0.5">
                          Why This Was Flagged
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {item.whyFlagged}
                        </p>
                      </div>

                      {/* System Impact */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide block mb-0.5">
                          Impact of Deleting
                        </span>
                        <p className="text-[11px] text-slate-200 leading-relaxed">
                          {item.systemImpact}
                        </p>
                      </div>

                      {/* Recreation Behavior */}
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-0.5">
                          Recreation / Recovery
                        </span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {item.recreationBehavior}
                        </p>
                      </div>

                      {/* Matching Files Preview */}
                      {matchingCandidates.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                              Current Flagged Files ({matchingCandidates.length})
                            </span>
                            <button
                              onClick={() => {
                                triggerHaptic('light');
                                onOpenReviewCategory(item.category);
                              }}
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                            >
                              Review & Select →
                            </button>
                          </div>

                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {matchingCandidates.map((file) => (
                              <div
                                key={file.id}
                                className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <p className="font-mono text-slate-200 truncate" title={file.name}>
                                    {file.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 truncate">{file.path}</p>
                                </div>
                                <span className="font-mono text-emerald-400 shrink-0 text-[10px]">
                                  {formatBytes(file.size)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Educational Note: Storage vs CPU Performance */}
        <M3Card className="bg-slate-900 border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Honest Performance Impact</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Reclaiming storage space resolves <strong>write latency</strong>, allows camera apps to save
            burst photos, prevents app installation errors, and stops Android OS low-storage throttling.
            CleanPulse does not advertise fake RAM boosters or battery chillers.
          </p>
        </M3Card>
      </div>
    </div>
  );
}
