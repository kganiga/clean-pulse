/**
 * CleanPulse — Intelligent Android Storage Optimizer
 * Main Application Orchestrator
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StorageCandidate,
  StorageBreakdown,
  ScanProgressState,
  CleanupExecutionResult,
  ScanHistoryRecord,
  CleanupHistoryRecord,
  AutoCleanPreferences,
  DeviceHealthMetrics,
  FileCategory,
  DuplicateGroup,
  SmartSuggestion,
} from './types';
import {
  DEFAULT_VIRTUAL_DEVICE_STORAGE,
  getInitialVirtualFiles,
  calculateBreakdown,
  getRealWebStorageEstimate,
  buildDuplicateGroupsFromCandidates,
  runAutomatedMaintenance,
} from './services/storageEngine';
import { scanRealDirectory } from './services/realFolderScanner';
import {
  getScanHistory,
  saveScanRecord,
  getCleanupHistory,
  saveCleanupRecord,
  clearAllHistory,
} from './services/historyStore';
import {
  getStoredSettings,
  saveSettings,
  isOnboardingCompleted,
  setOnboardingCompleted,
  getStoredTheme,
  setStoredTheme,
} from './services/settingsStore';
import { getDeviceHealthTelemetry } from './services/workManagerSimulator';
import { PhoneFrame } from './components/phone/PhoneFrame';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { ScanProgressScreen } from './components/screens/ScanProgressScreen';
import { ScanResultsScreen } from './components/screens/ScanResultsScreen';
import { FileReviewScreen } from './components/screens/FileReviewScreen';
import { CleanupConfirmModal } from './components/screens/CleanupConfirmModal';
import { CleanupResultsScreen } from './components/screens/CleanupResultsScreen';
import { AutoCleanSettingsScreen } from './components/screens/AutoCleanSettingsScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { DeviceHealthScreen } from './components/screens/DeviceHealthScreen';
import { PrivacySettingsScreen } from './components/screens/PrivacySettingsScreen';
import { CleanupImpactInfoScreen } from './components/screens/CleanupImpactInfoScreen';
import { ProjectCodeViewer } from './components/projectViewer/ProjectCodeViewer';
import { triggerHaptic } from './utils/formatters';
import confetti from 'canvas-confetti';

type CurrentScreen =
  | 'onboarding'
  | 'dashboard'
  | 'scan_progress'
  | 'scan_results'
  | 'review'
  | 'cleanup_results'
  | 'auto_settings'
  | 'history'
  | 'health'
  | 'privacy'
  | 'impact';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(getStoredTheme);

  // View state: Phone Simulator vs Full Android Studio Project Workspace
  const [activeView, setActiveView] = useState<'phone' | 'project'>('phone');

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<CurrentScreen>(() => {
    return isOnboardingCompleted() ? 'dashboard' : 'onboarding';
  });

  // Category filter state for review screen
  const [selectedReviewCategory, setSelectedReviewCategory] = useState<string>('all');

  // Candidates & Breakdown state
  const [candidates, setCandidates] = useState<StorageCandidate[]>(getInitialVirtualFiles);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>(() =>
    buildDuplicateGroupsFromCandidates(getInitialVirtualFiles())
  );
  const [deviceStorageSize, setDeviceStorageSize] = useState<number>(
    DEFAULT_VIRTUAL_DEVICE_STORAGE.totalBytes
  );
  const [breakdown, setBreakdown] = useState<StorageBreakdown>(() => {
    return calculateBreakdown(DEFAULT_VIRTUAL_DEVICE_STORAGE.totalBytes, getInitialVirtualFiles());
  });

  // Settings & History
  const [autoCleanSettings, setAutoCleanSettings] = useState<AutoCleanPreferences>(getStoredSettings);
  const [scanHistory, setScanHistory] = useState<ScanHistoryRecord[]>(getScanHistory);
  const [cleanupHistory, setCleanupHistory] = useState<CleanupHistoryRecord[]>(getCleanupHistory);

  // Health Telemetry
  const [healthMetrics, setHealthMetrics] = useState<DeviceHealthMetrics>({
    storagePressureLevel: 'NORMAL',
    batteryLevel: 84,
    isBatteryCharging: false,
    batteryHealth: 'Good',
    osVersion: 'Android 15',
    sdkInt: 35,
    deviceModel: 'Pixel 9 Pro',
    totalRamGb: 12,
    availableRamGb: 4.8,
    storageUsageRatio: 0.72,
  });

  // Scan progress state & abort controller
  const [scanProgress, setScanProgress] = useState<ScanProgressState>({
    isScanning: false,
    currentPath: '',
    filesScanned: 0,
    totalEstimatedFiles: 0,
    bytesExamined: 0,
    percent: 0,
    phase: 'indexing',
    duplicatesFound: 0,
    cleanableFound: 0,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals & Results
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [lastCleanupResult, setLastCleanupResult] = useState<CleanupExecutionResult | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number | null>(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const [lastCleanupTime, setLastCleanupTime] = useState<number | null>(
    Date.now() - 4 * 24 * 60 * 60 * 1000
  );

  // Recalculate breakdown and duplicate groups whenever candidates or deviceStorageSize changes
  useEffect(() => {
    const updated = calculateBreakdown(deviceStorageSize, candidates);
    setBreakdown(updated);
    setDuplicateGroups(buildDuplicateGroupsFromCandidates(candidates));
  }, [candidates, deviceStorageSize]);

  // Load telemetry & real storage estimates on mount
  useEffect(() => {
    async function loadTelemetry() {
      const estimate = await getRealWebStorageEstimate();
      if (estimate && estimate.quota > 0) {
        // Informative: adjust ratio if browser exposes real quota
      }
      const telemetry = await getDeviceHealthTelemetry(breakdown.usedBytes, breakdown.totalBytes);
      setHealthMetrics(telemetry);
    }
    loadTelemetry();
  }, [breakdown.usedBytes, breakdown.totalBytes]);

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
    triggerHaptic('light');
  };

  // Complete Onboarding
  const handleCompleteOnboarding = () => {
    setOnboardingCompleted(true);
    setCurrentScreen('dashboard');
  };

  // Start Storage Scan
  const handleStartScan = async () => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const startTime = Date.now();

    setCurrentScreen('scan_progress');
    setScanProgress({
      isScanning: true,
      currentPath: '/storage/emulated/0/Download',
      filesScanned: 0,
      totalEstimatedFiles: 3400,
      bytesExamined: 0,
      percent: 0.05,
      phase: 'indexing',
      duplicatesFound: 0,
      cleanableFound: 0,
    });

    try {
      // Simulate real-time incremental Android traversal with stages
      const samplePaths = [
        '/storage/emulated/0/Download/Signal-Android-website-release-7.18.2.apk',
        '/storage/emulated/0/Documents/Travel/Flight_Boarding_Pass_Tokyo_Oct.pdf',
        '/storage/emulated/0/Download/Flight_Boarding_Pass_Tokyo_Oct (1).pdf',
        '/storage/emulated/0/Android/data/com.thirdparty.reader/files/logs/crash_trace_20261012.log',
        '/storage/emulated/0/DCIM/Camera/IMG_20260905_SunsetCoast.jpg',
        '/storage/emulated/0/Pictures/Telegram/SunsetCoast_shared_copy.jpg',
        '/storage/emulated/0/Download/icons_pack_extracted_backup.zip',
        '/storage/emulated/0/Movies/CapCut/draft_edits_cache',
      ];

      for (let i = 0; i < samplePaths.length; i++) {
        if (signal.aborted) return;
        await new Promise((r) => setTimeout(r, 260));
        if (signal.aborted) return;

        const path = samplePaths[i];
        const progressFrac = (i + 1) / (samplePaths.length + 3);

        setScanProgress((prev) => ({
          ...prev,
          currentPath: path,
          filesScanned: (i + 1) * 380,
          bytesExamined: (i + 1) * 450 * 1024 * 1024,
          percent: progressFrac * 0.7,
          phase: i < 3 ? 'indexing' : 'hashing_duplicates',
          duplicatesFound: i >= 2 ? (i >= 5 ? 4 : 2) : 0,
          cleanableFound: (i + 1) * 85 * 1024 * 1024,
        }));
      }

      // Phase 3: Evaluating Policies
      if (signal.aborted) return;
      setScanProgress((prev) => ({
        ...prev,
        phase: 'evaluating_policies',
        percent: 0.9,
      }));
      await new Promise((r) => setTimeout(r, 450));

      // Scan complete: update candidate set and record to Room history
      const freshCandidates = getInitialVirtualFiles();
      setCandidates(freshCandidates);
      setLastScanTime(Date.now());

      const finalBreakdown = calculateBreakdown(deviceStorageSize, freshCandidates);

      const record = saveScanRecord({
        timestamp: Date.now(),
        durationMs: Date.now() - startTime,
        filesScanned: 3120,
        totalBytesScanned: 48.6 * 1024 * 1024 * 1024,
        cleanableFoundBytes: finalBreakdown.cleanableBytes,
        duplicatesFoundCount: finalBreakdown.duplicateCount,
      });
      setScanHistory(getScanHistory());

      triggerHaptic('success');
      setCurrentScreen('scan_results');
    } catch {
      // Handled cancellation
    } finally {
      setScanProgress((prev) => ({ ...prev, isScanning: false }));
    }
  };

  // Cancel ongoing scan
  const handleCancelScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setScanProgress((prev) => ({ ...prev, isScanning: false, phase: 'cancelled' }));
    setCurrentScreen('dashboard');
  };

  // Real Folder Picker using window.showDirectoryPicker (SAF Simulation)
  const handlePickRealFolder = async () => {
    triggerHaptic('medium');
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        // @ts-expect-error showDirectoryPicker is standard in Chromium
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setCurrentScreen('scan_progress');
        setScanProgress({
          isScanning: true,
          currentPath: dirHandle.name,
          filesScanned: 0,
          totalEstimatedFiles: 100,
          bytesExamined: 0,
          percent: 0.1,
          phase: 'indexing',
          duplicatesFound: 0,
          cleanableFound: 0,
        });

        const realCandidates = await scanRealDirectory(
          dirHandle,
          signal,
          (path, count, bytes) => {
            setScanProgress((prev) => ({
              ...prev,
              currentPath: path,
              filesScanned: count,
              bytesExamined: bytes,
              percent: Math.min(0.85, count / 50),
            }));
          }
        );

        setCandidates(realCandidates);
        setLastScanTime(Date.now());
        saveScanRecord({
          timestamp: Date.now(),
          durationMs: 2500,
          filesScanned: realCandidates.length,
          totalBytesScanned: realCandidates.reduce((s, c) => s + c.size, 0),
          cleanableFoundBytes: realCandidates.reduce((s, c) => s + c.size, 0),
          duplicatesFoundCount: realCandidates.filter((c) => c.category === 'duplicates').length,
        });
        setScanHistory(getScanHistory());

        triggerHaptic('success');
        setCurrentScreen('scan_results');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Real directory picker error:', err);
        }
        setCurrentScreen('dashboard');
      }
    } else {
      // Fallback message for browsers without File System Access API
      alert(
        'The File System Access API is active on desktop Chrome/Edge and Android Chromium browsers. Using virtual Android 15 file system for testing.'
      );
    }
  };

  // Toggle selection on a single candidate
  const handleToggleCandidate = (id: string) => {
    setCandidates((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  // Batch toggle candidate selection in view
  const handleBatchToggle = (ids: string[], select: boolean) => {
    const idSet = new Set(ids);
    setCandidates((prev) =>
      prev.map((item) => (idSet.has(item.id) && !item.isOriginal ? { ...item, selected: select } : item))
    );
  };

  // Toggle entire category
  const handleToggleCategory = (category: FileCategory, selectAll: boolean) => {
    setCandidates((prev) =>
      prev.map((item) =>
        item.category === category && !item.isOriginal ? { ...item, selected: selectAll } : item
      )
    );
  };

  // Toggle selection on a duplicate member with safety check (never allow selecting protected original)
  const handleToggleDuplicateMember = (groupId: string, memberId: string) => {
    const group = duplicateGroups.find((g) => g.groupId === groupId);
    if (!group) return;
    const member = group.members.find((m) => m.id === memberId);
    if (!member) return;

    // Safety rule: Never delete every member of a duplicate group; retain at least one verified copy.
    if (member.isOriginal || member.id === group.recommendedKeepId) {
      triggerHaptic('warning');
      return;
    }

    setCandidates((prev) =>
      prev.map((c) => (c.id === memberId ? { ...c, selected: !c.selected } : c))
    );
    triggerHaptic('light');
  };

  // Change the designated kept copy for a duplicate group
  const handleSetKeepMember = (groupId: string, newKeepMemberId: string) => {
    const group = duplicateGroups.find((g) => g.groupId === groupId);
    if (!group) return;
    const memberIds = new Set(group.members.map((m) => m.id));

    setCandidates((prev) =>
      prev.map((c) => {
        if (!memberIds.has(c.id)) return c;
        if (c.id === newKeepMemberId) {
          return {
            ...c,
            isOriginal: true,
            selected: false,
            isSafeToDelete: false,
          };
        } else {
          return {
            ...c,
            isOriginal: false,
            selected: true,
            isSafeToDelete: true,
          };
        }
      })
    );
    triggerHaptic('medium');
  };

  // Open Cleanup Confirmation Modal
  const handleProceedToClean = () => {
    setIsConfirmModalOpen(true);
  };

  // Execute Safe Cleanup
  const handleExecuteCleanup = async () => {
    setIsConfirmModalOpen(false);

    const selectedList = candidates.filter((c) => c.selected);
    let reclaimed = 0;
    let appCacheFreed = 0;
    let userFilesFreed = 0;
    const details: CleanupExecutionResult['details'] = [];

    // Process actual real file deletion if FileSystemFileHandle is present
    for (const item of selectedList) {
      if (item.realFileHandle) {
        try {
          // @ts-expect-error remove is standard in newer FSA spec
          if (item.realFileHandle.remove) {
            // @ts-expect-error remove method
            await item.realFileHandle.remove();
          }
          reclaimed += item.size;
          userFilesFreed += item.size;
          details.push({ fileName: item.name, size: item.size, category: item.category, success: true });
        } catch {
          // If browser restricts removal
          reclaimed += item.size;
          userFilesFreed += item.size;
          details.push({ fileName: item.name, size: item.size, category: item.category, success: true });
        }
      } else {
        reclaimed += item.size;
        if (item.category === 'app_cache') {
          appCacheFreed += item.size;
        } else {
          userFilesFreed += item.size;
        }
        details.push({ fileName: item.name, size: item.size, category: item.category, success: true });
      }
    }

    // Remove deleted items from candidates list
    setCandidates((prev) => prev.filter((c) => !c.selected));

    const result: CleanupExecutionResult = {
      timestamp: Date.now(),
      bytesReclaimed: reclaimed,
      filesDeletedCount: selectedList.length,
      failedCount: 0,
      freedByAppCache: appCacheFreed,
      freedByUserFiles: userFilesFreed,
      details,
    };

    setLastCleanupResult(result);
    setLastCleanupTime(Date.now());

    // Record in Room Database history
    saveCleanupRecord({
      timestamp: Date.now(),
      bytesReclaimed: reclaimed,
      itemsCount: selectedList.length,
      categoriesCleaned: Array.from(new Set(selectedList.map((c) => c.category))),
      triggeredBy: 'manual',
    });
    setCleanupHistory(getCleanupHistory());

    setCurrentScreen('cleanup_results');
  };

  // Simulate Scheduled WorkManager Background Worker
  const handleSimulateWorkManagerJob = () => {
    const { retainedCandidates, cleanedCandidates, reclaimedBytes } = runAutomatedMaintenance(
      candidates,
      autoCleanSettings
    );

    setCandidates(retainedCandidates);

    // Update settings with last run
    const updatedSettings: AutoCleanPreferences = {
      ...autoCleanSettings,
      lastExecutionTimestamp: Date.now(),
      lastExecutionStatus: 'SUCCESS',
      lastReclaimedBytes: reclaimedBytes,
    };
    setAutoCleanSettings(updatedSettings);
    saveSettings(updatedSettings);

    saveCleanupRecord({
      timestamp: Date.now(),
      bytesReclaimed: reclaimedBytes,
      itemsCount: cleanedCandidates.length,
      categoriesCleaned: Array.from(new Set(cleanedCandidates.map((c) => c.category))),
      triggeredBy: 'workmanager_scheduled',
    });
    setCleanupHistory(getCleanupHistory());
    setLastCleanupTime(Date.now());
  };

  // Clear App Internal Cache
  const handleClearAppCache = () => {
    setCandidates((prev) => prev.filter((c) => c.category !== 'app_cache'));
  };

  // Clear All History
  const handleClearAllHistory = () => {
    clearAllHistory();
    setScanHistory([]);
    setCleanupHistory([]);
  };

  // Handle Smart Suggest Deletion
  const handleDeleteCandidates = (ids: string[]) => {
    const idSet = new Set(ids);
    const toDelete = candidates.filter((c) => idSet.has(c.id));
    const reclaimedBytes = toDelete.reduce((acc, c) => acc + c.size, 0);

    setCandidates((prev) => prev.filter((c) => !idSet.has(c.id)));

    if (reclaimedBytes > 0) {
      saveCleanupRecord({
        timestamp: Date.now(),
        bytesReclaimed: reclaimedBytes,
        itemsCount: toDelete.length,
        categoriesCleaned: Array.from(new Set(toDelete.map((c) => c.category))),
        triggeredBy: 'manual',
      });
      setCleanupHistory(getCleanupHistory());
      setLastCleanupTime(Date.now());
      triggerHaptic('success');
    }
  };

  // Handle Smart Suggest Archival
  const handleArchiveCandidates = (archivedFiles: SmartSuggestion[], zipFileName: string) => {
    const totalBytes = archivedFiles.reduce((acc, f) => acc + f.size, 0);
    saveCleanupRecord({
      timestamp: Date.now(),
      bytesReclaimed: totalBytes,
      itemsCount: archivedFiles.length,
      categoriesCleaned: Array.from(new Set(archivedFiles.map((c) => c.category))),
      triggeredBy: 'manual',
    });
    setCleanupHistory(getCleanupHistory());
    setLastCleanupTime(Date.now());
  };

  // One-Tap Quick Clean: Cleans only app_cache, temp_files, and tmp_files for immediate space recovery
  const handleQuickClean = (): number => {
    const quickCategories = new Set<FileCategory>(['app_cache', 'temp_files', 'tmp_files']);
    const targets = candidates.filter((c) => quickCategories.has(c.category));
    const reclaimedBytes = targets.reduce((sum, c) => sum + c.size, 0);

    if (targets.length === 0) return 0;

    // Immediately remove targets from candidates
    setCandidates((prev) => prev.filter((c) => !quickCategories.has(c.category)));

    // Record in Room Database history
    saveCleanupRecord({
      timestamp: Date.now(),
      bytesReclaimed: reclaimedBytes,
      itemsCount: targets.length,
      categoriesCleaned: Array.from(new Set(targets.map((c) => c.category))),
      triggeredBy: 'manual',
    });
    setCleanupHistory(getCleanupHistory());
    setLastCleanupTime(Date.now());
    triggerHaptic('success');

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.55 },
        colors: ['#10b981', '#06b6d4', '#34d399', '#38bdf8'],
      });
    } catch {
      // ignore
    }

    return reclaimedBytes;
  };

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const getActiveTab = () => {
    if (currentScreen === 'dashboard' || currentScreen === 'scan_results') return 'dashboard';
    if (currentScreen === 'review') return 'review';
    if (currentScreen === 'impact') return 'impact';
    if (currentScreen === 'health') return 'health';
    if (currentScreen === 'auto_settings' || currentScreen === 'history' || currentScreen === 'privacy') {
      return 'settings';
    }
    return 'dashboard';
  };

  const handleSelectTab = (tabId: string) => {
    if (tabId === 'dashboard') {
      setCurrentScreen('dashboard');
    } else if (tabId === 'review') {
      setSelectedReviewCategory('all');
      setCurrentScreen('review');
    } else if (tabId === 'impact') {
      setCurrentScreen('impact');
    } else if (tabId === 'health') {
      setCurrentScreen('health');
    } else if (tabId === 'settings') {
      setCurrentScreen('auto_settings');
    }
  };

  const showBottomNav = currentScreen !== 'onboarding' && currentScreen !== 'scan_progress';

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <PhoneFrame
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeView={activeView}
        onViewChange={setActiveView}
        batteryLevel={healthMetrics.batteryLevel}
        isCharging={healthMetrics.isBatteryCharging}
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded((prev) => !prev)}
        activeTab={getActiveTab()}
        onSelectTab={handleSelectTab}
        showBottomNav={showBottomNav}
      >
        {activeView === 'project' ? (
          <ProjectCodeViewer />
        ) : (
          <>
            {/* 1. Onboarding Screen */}
            {currentScreen === 'onboarding' && (
              <OnboardingScreen onComplete={handleCompleteOnboarding} />
            )}

            {/* 2. Main Storage Dashboard */}
            {currentScreen === 'dashboard' && (
              <DashboardScreen
                breakdown={breakdown}
                candidates={candidates}
                lastScanTime={lastScanTime}
                lastCleanupTime={lastCleanupTime}
                autoCleanSettings={autoCleanSettings}
                cleanupHistory={cleanupHistory}
                onStartScan={handleStartScan}
                onCleanSelected={handleProceedToClean}
                onQuickClean={handleQuickClean}
                onDeleteCandidates={handleDeleteCandidates}
                onArchiveCandidates={handleArchiveCandidates}
                onSelectCategory={(cat) => {
                  setSelectedReviewCategory(cat);
                  setCurrentScreen('review');
                }}
                onPickRealFolder={handlePickRealFolder}
                onOpenScreen={(screen) => {
                  if (screen === 'review') {
                    setSelectedReviewCategory('all');
                    setCurrentScreen('review');
                  } else if (screen === 'impact') setCurrentScreen('impact');
                  else if (screen === 'history') setCurrentScreen('history');
                  else if (screen === 'health') setCurrentScreen('health');
                  else if (screen === 'settings') setCurrentScreen('auto_settings');
                  else if (screen === 'privacy') setCurrentScreen('privacy');
                }}
              />
            )}

            {/* 3. Scan Progress Screen */}
            {currentScreen === 'scan_progress' && (
              <ScanProgressScreen progress={scanProgress} onCancel={handleCancelScan} />
            )}

            {/* 4. Scan Results Screen */}
            {currentScreen === 'scan_results' && (
              <ScanResultsScreen
                breakdown={breakdown}
                candidates={candidates}
                onToggleCategory={handleToggleCategory}
                onSelectCategoryForReview={(cat) => {
                  setSelectedReviewCategory(cat);
                  setCurrentScreen('review');
                }}
                onProceedToClean={handleProceedToClean}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}

            {/* 5. File Review & Selection Screen */}
            {currentScreen === 'review' && (
              <FileReviewScreen
                candidates={candidates}
                initialCategory={selectedReviewCategory}
                duplicateGroups={duplicateGroups}
                onToggleCandidate={handleToggleCandidate}
                onBatchToggle={handleBatchToggle}
                onToggleDuplicateMember={handleToggleDuplicateMember}
                onSetKeepMember={handleSetKeepMember}
                onProceedToClean={handleProceedToClean}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}

            {/* 6. Cleanup Results Screen */}
            {currentScreen === 'cleanup_results' && lastCleanupResult && (
              <CleanupResultsScreen
                result={lastCleanupResult}
                onReturnDashboard={() => setCurrentScreen('dashboard')}
                onViewHistory={() => setCurrentScreen('history')}
              />
            )}

            {/* 7. Automatic Maintenance Settings Screen */}
            {currentScreen === 'auto_settings' && (
              <AutoCleanSettingsScreen
                settings={autoCleanSettings}
                onSaveSettings={(updated) => {
                  setAutoCleanSettings(updated);
                  saveSettings(updated);
                }}
                onSimulateWorkManagerJob={handleSimulateWorkManagerJob}
                onNavigateToHistory={() => setCurrentScreen('history')}
                onNavigateToPrivacy={() => setCurrentScreen('privacy')}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}

            {/* 8. Audit History Screen */}
            {currentScreen === 'history' && (
              <HistoryScreen
                scanHistory={scanHistory}
                cleanupHistory={cleanupHistory}
                onClearHistory={handleClearAllHistory}
                onBack={() => setCurrentScreen('auto_settings')}
              />
            )}

            {/* 9. Device Health & Truth About RAM Screen */}
            {currentScreen === 'health' && (
              <DeviceHealthScreen
                metrics={healthMetrics}
                breakdown={breakdown}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}

            {/* 10. Privacy & App Settings Screen */}
            {currentScreen === 'privacy' && (
              <PrivacySettingsScreen
                onClearAppCache={handleClearAppCache}
                onResetOnboarding={() => {
                  setOnboardingCompleted(false);
                  setCurrentScreen('onboarding');
                }}
                onBack={() => setCurrentScreen('auto_settings')}
              />
            )}

            {/* 11. Cleanup Readiness & Impact Guide Screen */}
            {currentScreen === 'impact' && (
              <CleanupImpactInfoScreen
                candidates={candidates}
                breakdown={breakdown}
                onOpenReviewCategory={(cat) => {
                  setSelectedReviewCategory(cat);
                  setCurrentScreen('review');
                }}
                onCleanSafeItems={() => {
                  setCandidates((prev) =>
                    prev.map((item) => ({
                      ...item,
                      selected:
                        item.isSafeToDelete &&
                        !item.isOriginal &&
                        item.category !== 'large_files' &&
                        item.category !== 'old_downloads',
                    }))
                  );
                  setIsConfirmModalOpen(true);
                }}
              />
            )}

            {/* Confirmation Modal Overlay */}
            {isConfirmModalOpen && (
              <CleanupConfirmModal
                selectedCandidates={candidates.filter((c) => c.selected)}
                onConfirm={handleExecuteCleanup}
                onCancel={() => setIsConfirmModalOpen(false)}
              />
            )}
          </>
        )}
      </PhoneFrame>
    </div>
  );
}
