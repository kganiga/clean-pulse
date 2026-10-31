import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Lock, Trash2, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../../utils/formatters';
import { M3Button, M3Card } from '../common/MaterialComponents';

export function PrivacySettingsScreen({
  onClearAppCache,
  onResetOnboarding,
  onBack,
}: {
  onClearAppCache: () => void;
  onResetOnboarding: () => void;
  onBack: () => void;
}) {
  const [clearedMsg, setClearedMsg] = useState(false);

  const handleClearCache = () => {
    triggerHaptic('medium');
    onClearAppCache();
    setClearedMsg(true);
    setTimeout(() => setClearedMsg(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col justify-between pb-6">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-2 border-b border-slate-800/60 shrink-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-100">Privacy & Permissions</h1>
            <p className="text-[11px] text-slate-400">On-Device Security Guarantees</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Privacy Constitution Card */}
          <M3Card className="space-y-3 bg-slate-900 border-slate-800">
            <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="w-5 h-5" />
              <span>CleanPulse Privacy Protocol</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400">·</span>
                <span>
                  <strong>Zero Telemetry:</strong> No tracking SDKs, Firebase analytics, or network
                  telemetry.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400">·</span>
                <span>
                  <strong>No Account Required:</strong> Operates entirely offline without sign-in or
                  cloud sync.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400">·</span>
                <span>
                  <strong>Local File Hashing:</strong> SHA-256 chunk calculations stay inside device
                  RAM and are discarded after scanning.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400">·</span>
                <span>
                  <strong>Least Privilege:</strong> Avoids dangerous permissions such as MANAGE_EXTERNAL_STORAGE
                  and Accessibility Service.
                </span>
              </div>
            </div>
          </M3Card>

          {/* Internal App Storage Management */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              CleanPulse Internal Cache
            </span>
            <M3Card className="space-y-3 bg-slate-900 border-slate-800">
              <p className="text-xs text-slate-400 leading-relaxed">
                CleanPulse stores temporary thumbnail caches and SQLite Room logs. You can purge them
                at any time without losing settings.
              </p>
              <M3Button
                onClick={handleClearCache}
                variant="tonal"
                className="w-full text-xs"
                icon={<Trash2 className="w-4 h-4 text-emerald-400" />}
              >
                Clear CleanPulse App Cache
              </M3Button>
              {clearedMsg && (
                <p className="text-xs text-emerald-400 text-center font-medium">
                  App internal cache safely purged.
                </p>
              )}
            </M3Card>
          </div>

          {/* Permission Flow Reset */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Onboarding & Permissions
            </span>
            <M3Card className="space-y-3 bg-slate-900 border-slate-800">
              <p className="text-xs text-slate-400 leading-relaxed">
                Rerun the initial scoped storage permission explanation and architectural overview.
              </p>
              <M3Button
                onClick={() => {
                  triggerHaptic('light');
                  onResetOnboarding();
                }}
                variant="outlined"
                className="w-full text-xs"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Replay Onboarding & Permissions
              </M3Button>
            </M3Card>
          </div>
        </div>
      </div>
    </div>
  );
}
