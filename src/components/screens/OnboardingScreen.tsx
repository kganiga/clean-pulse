import { ShieldCheck, Cpu, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { M3Button } from '../common/MaterialComponents';
import { CleanPulseLogo, APP_MARK_PATH } from '../common/CleanPulseLogo';
import { triggerHaptic } from '../../utils/formatters';

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const handleStart = () => {
    triggerHaptic('medium');
    onComplete();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
      <div className="space-y-5 pt-2">
        {/* App Emblem & Brand Header */}
        <div className="flex items-center gap-4">
          <CleanPulseLogo size="xl" variant="icon" className="shadow-lg shadow-emerald-500/20" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
              <span>CleanPulse</span>
            </h1>
            <p className="text-xs font-semibold text-emerald-400 tracking-wide mt-0.5">
              smart. fresh. lived.
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">
              Android 15 Intelligent Storage Optimizer
            </p>
          </div>
        </div>

        {/* Brand Banner Card */}
        <div className="rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-950 relative shadow-md">
          <img
            src={APP_MARK_PATH}
            alt="CleanPulse"
            className="w-full h-28 object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end p-3">
            <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next-gen chunked hashing &amp; Smart Suggest engine</span>
            </span>
          </div>
        </div>

        {/* Core Architectural Guarantees */}
        <div className="space-y-3.5 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-semibold text-slate-200">100% On-Device Processing</h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Zero cloud uploads, analytics, or trackers. All hashing and evaluations happen on your device.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-semibold text-slate-200">Scoped Storage & SAF</h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                CleanPulse uses Android MediaStore and Storage Access Framework. Never asks for root or full-disk overrides.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-semibold text-slate-200">No Fake RAM Boosters</h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                We reclaim genuine file storage without killing background processes or harming battery health.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <M3Button onClick={handleStart} className="w-full" icon={<ArrowRight className="w-4 h-4" />}>
          Grant Access & Continue
        </M3Button>
        <p className="text-[11px] text-slate-500 text-center mt-3">
          Compatible with Android 8.0 through Android 15
        </p>
      </div>
    </div>
  );
}
