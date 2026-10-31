import React, { useState } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  TrendingUp,
  Globe,
  Cloud,
  MessageSquare,
  Smartphone,
  Film,
  HardDrive,
  Info,
  ExternalLink,
  X,
  Check,
} from 'lucide-react';
import {
  STORAGE_TIPS,
  StorageTip,
  getTodaysStorageTip,
  isTipCompletedToday,
  toggleTipCompletedToday,
} from '../../data/storageTips';
import { triggerHaptic } from '../../utils/formatters';
import { M3Button } from '../common/MaterialComponents';

export function StorageTipsCard() {
  const { tip: defaultTip, tipIndex: defaultIndex } = React.useMemo(() => getTodaysStorageTip(), []);
  const [currentIndex, setCurrentIndex] = useState(defaultIndex);
  const [isCompleted, setIsCompleted] = useState(() => isTipCompletedToday(STORAGE_TIPS[defaultIndex].id));
  const [showStepsModal, setShowStepsModal] = useState(false);

  const currentTip = STORAGE_TIPS[currentIndex];
  const isToday = currentIndex === defaultIndex;

  const handleNextTip = () => {
    triggerHaptic('light');
    const nextIdx = (currentIndex + 1) % STORAGE_TIPS.length;
    setCurrentIndex(nextIdx);
    setIsCompleted(isTipCompletedToday(STORAGE_TIPS[nextIdx].id));
  };

  const handlePrevTip = () => {
    triggerHaptic('light');
    const prevIdx = (currentIndex - 1 + STORAGE_TIPS.length) % STORAGE_TIPS.length;
    setCurrentIndex(prevIdx);
    setIsCompleted(isTipCompletedToday(STORAGE_TIPS[prevIdx].id));
  };

  const handleToggleComplete = () => {
    triggerHaptic('success');
    const nextState = toggleTipCompletedToday(currentTip.id);
    setIsCompleted(nextState);
  };

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/15 to-slate-900 border border-amber-500/25 p-4 shadow-sm relative overflow-hidden group">
        {/* Subtle ambient amber accent */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100 tracking-tight">Storage Tip</span>
                {isToday && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-500/30">
                    Today
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-mono mr-1">
              {currentIndex + 1} of {STORAGE_TIPS.length}
            </span>
            <button
              onClick={handlePrevTip}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Previous tip"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextTip}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Next tip"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tip Content */}
        <div className="space-y-2 mt-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs font-semibold text-slate-100 leading-snug">
              {currentTip.title}
            </h4>
            <CategoryBadge category={currentTip.category} />
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {currentTip.tagline}
          </p>

          {/* Potential Savings Strip */}
          <div className="flex items-center justify-between text-[10px] bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 mt-2">
            <div className="flex items-center gap-1 text-slate-400">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Potential space gain:</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {currentTip.potentialSavings}
              </span>
            </div>
            <span className="text-slate-500">{currentTip.difficulty}</span>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowStepsModal(true);
              }}
              className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/60 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>How To Do This</span>
            </button>

            <button
              onClick={handleToggleComplete}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              {isCompleted ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Applied</span>
                </>
              ) : (
                <span>Mark Done</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Actionable Steps Modal */}
      {showStepsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Storage Guide</h3>
                  <p className="text-[10px] text-slate-400">Actionable step-by-step instructions</p>
                </div>
              </div>
              <button
                onClick={() => setShowStepsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <h4 className="font-semibold text-slate-100 text-sm">{currentTip.title}</h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  {currentTip.description}
                </p>
              </div>

              {/* Potential Savings Banner */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400 block font-medium">Estimated Storage Gain</span>
                  <span className="text-sm font-bold font-mono text-emerald-300">
                    {currentTip.potentialSavings}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                  {currentTip.difficulty}
                </span>
              </div>

              {/* Numbered Steps */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Step-by-Step Instructions
                </span>
                <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {currentTip.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 border border-amber-500/30 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300 text-xs leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {currentTip.systemSettingPath && (
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-300 block mb-0.5">Quick Location Path:</span>
                  <span className="font-mono text-[10px] text-amber-400 block break-all">
                    {currentTip.systemSettingPath}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => {
                  handleToggleComplete();
                  setShowStepsModal(false);
                }}
                className={`flex-1 h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isCompleted
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Completed</span>
                  </>
                ) : (
                  <span>Mark Done for Today</span>
                )}
              </button>

              <button
                onClick={() => setShowStepsModal(false)}
                className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CategoryBadge({ category }: { category: StorageTip['category'] }) {
  const styles = {
    Browser: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    'Cloud Photos': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    Messaging: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    Apps: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    Media: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    System: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };

  const icons = {
    Browser: <Globe className="w-3 h-3" />,
    'Cloud Photos': <Cloud className="w-3 h-3" />,
    Messaging: <MessageSquare className="w-3 h-3" />,
    Apps: <Smartphone className="w-3 h-3" />,
    Media: <Film className="w-3 h-3" />,
    System: <HardDrive className="w-3 h-3" />,
  };

  return (
    <span
      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 shrink-0 ${styles[category]}`}
    >
      {icons[category]}
      <span>{category}</span>
    </span>
  );
}
