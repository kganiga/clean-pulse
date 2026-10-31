package com.cleanpulse.app.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.cleanpulse.app.CleanPulseApplication
import com.cleanpulse.app.data.cleanup.ArchiveEngine
import com.cleanpulse.app.data.cleanup.ArchiveResult
import com.cleanpulse.app.data.cleanup.CleanupResult
import com.cleanpulse.app.data.cleanup.SafeCleanupEngine
import com.cleanpulse.app.data.health.AppStorage
import com.cleanpulse.app.data.health.BatteryInfo
import com.cleanpulse.app.data.health.DeviceHealthRepository
import com.cleanpulse.app.data.local.AutoCleanSettings
import com.cleanpulse.app.data.local.CleanupHistoryEntity
import com.cleanpulse.app.data.local.SavedScan
import com.cleanpulse.app.data.local.ScanHistoryEntity
import com.cleanpulse.app.data.local.ScanResultStore
import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.model.ScanPhase
import com.cleanpulse.app.data.model.ScanProgressState
import com.cleanpulse.app.data.model.StorageCandidate
import com.cleanpulse.app.data.repository.StorageTip
import com.cleanpulse.app.data.repository.StorageTipsRepository
import com.cleanpulse.app.data.scanner.FileScanner
import com.cleanpulse.app.data.storage.DeviceStorage
import com.cleanpulse.app.data.storage.StorageAccess
import com.cleanpulse.app.domain.SmartSuggestEngine
import com.cleanpulse.app.domain.SmartSuggestSummary
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File

data class CompletedCleanup(val result: CleanupResult, val timestamp: Long)

data class HealthState(
    val battery: BatteryInfo? = null,
    val hasUsageAccess: Boolean = false,
    val apps: List<AppStorage> = emptyList(),
    val loadingApps: Boolean = false
)

data class StorageUiState(
    val hasAccess: Boolean = false,
    val device: DeviceStorage = DeviceStorage(0, 0),
    val scan: ScanProgressState = ScanProgressState(),
    val scannedFolder: String? = null,
    val candidates: List<StorageCandidate> = emptyList(),
    val selectedIds: Set<String> = emptySet(),
    val lastScanAt: Long? = null,
    val isCleaning: Boolean = false,
    val lastCleanup: CompletedCleanup? = null,
    val smartSuggest: SmartSuggestSummary? = null,
    val isArchiving: Boolean = false,
    val lastArchive: ArchiveResult? = null,
    val health: HealthState = HealthState()
) {
    val hasResults: Boolean get() = lastScanAt != null

    fun inCategory(category: FileCategory) = candidates.filter { it.category == category }

    val selectedCandidates: List<StorageCandidate>
        get() = candidates.filter { it.id in selectedIds && it.isDeletable }

    val selectedBytes: Long get() = selectedCandidates.sumOf { it.size }

    val safeBytes: Long get() = candidates.filter { it.isSafeToDelete && it.isDeletable }.sumOf { it.size }

    val reviewBytes: Long get() = candidates.filter { !it.isSafeToDelete && it.isDeletable }.sumOf { it.size }

    /** One-tap Quick Clean: cache and temporary files only. */
    val quickCleanCandidates: List<StorageCandidate>
        get() = candidates.filter { it.category == FileCategory.APP_CACHE || it.category == FileCategory.TEMP_FILES }
}

/** The kept copy of a duplicate group can never be selected. */
val StorageCandidate.isDeletable: Boolean get() = !isOriginal

class StorageViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as CleanPulseApplication
    private val scanner = FileScanner(application)
    private val cleanupEngine = SafeCleanupEngine(application)
    private val archiveEngine = ArchiveEngine(application)
    private val healthRepository = DeviceHealthRepository(application)
    private val smartSuggestEngine = SmartSuggestEngine()
    private val tipsRepository = StorageTipsRepository()
    private val resultStore = ScanResultStore(application)
    private var scanJob: Job? = null

    private val _state = MutableStateFlow(StorageUiState())
    val state: StateFlow<StorageUiState> = _state.asStateFlow()

    val settings: StateFlow<AutoCleanSettings> = app.settingsDataStore.settingsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), AutoCleanSettings())

    /** null until DataStore has been read, so the first frame doesn't flash onboarding. */
    val onboardingDone: StateFlow<Boolean?> = app.settingsDataStore.onboardingDone
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    val cleanupHistory: StateFlow<List<CleanupHistoryEntity>> = app.database.cleanupDao().getAllCleanups()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val scanHistory: StateFlow<List<ScanHistoryEntity>> = app.database.scanHistoryDao().getAllScans()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val tips: List<StorageTip> = tipsRepository.allTips
    val todayTipIndex: Int = tips.indexOf(tipsRepository.getTodayTip()).coerceAtLeast(0)

    init {
        refreshDevice()
        viewModelScope.launch {
            scanner.scanProgress.collect { progress -> _state.update { it.copy(scan = progress) } }
        }
        viewModelScope.launch {
            resultStore.load()?.let { saved ->
                if (_state.value.lastScanAt == null) {
                    _state.update {
                        it.copy(
                            candidates = saved.candidates,
                            selectedIds = saved.candidates.filter { c -> c.selected && c.isDeletable }.map { c -> c.id }.toSet(),
                            lastScanAt = saved.scannedAt,
                            scannedFolder = saved.folder,
                            smartSuggest = suggest(saved.candidates)
                        )
                    }
                }
            }
            // Persist every change to the result list (new scan, cleanup, archive).
            _state.map { it.lastScanAt to it.candidates }
                .distinctUntilChanged()
                .drop(1)
                .collect { (scannedAt, candidates) ->
                    if (scannedAt != null) {
                        resultStore.save(SavedScan(scannedAt, _state.value.scannedFolder, candidates))
                    }
                }
        }
    }

    /** Once every extra copy is gone, the kept original is no longer a duplicate. */
    private fun pruneDuplicates(candidates: List<StorageCandidate>): List<StorageCandidate> {
        val groupSizes = candidates.filter { it.category == FileCategory.DUPLICATES }.groupingBy { it.duplicateGroupId }.eachCount()
        return candidates.filterNot { it.category == FileCategory.DUPLICATES && (groupSizes[it.duplicateGroupId] ?: 0) < 2 }
    }

    private fun suggest(candidates: List<StorageCandidate>) =
        smartSuggestEngine.analyzeCandidates(candidates.filter { it.isDeletable })

    fun refreshDevice() {
        _state.update {
            it.copy(
                hasAccess = StorageAccess.hasFullAccess(app),
                device = StorageAccess.deviceStorage(),
                health = it.health.copy(battery = healthRepository.battery(), hasUsageAccess = healthRepository.hasUsageAccess())
            )
        }
    }

    fun completeOnboarding() {
        viewModelScope.launch { app.settingsDataStore.setOnboardingDone(true) }
    }

    fun replayOnboarding() {
        viewModelScope.launch { app.settingsDataStore.setOnboardingDone(false) }
    }

    fun startScan(folder: File? = null) {
        if (scanJob?.isActive == true) return
        scanJob = viewModelScope.launch {
            val started = System.currentTimeMillis()
            val current = settings.value
            try {
                val results = scanner.scanStorage(
                    oldFileDaysThreshold = current.maxFileAgeDays,
                    largeFileBytesThreshold = current.largeFileThresholdMb * 1024L * 1024L,
                    folder = folder
                )
                val progress = scanner.scanProgress.value
                _state.update {
                    it.copy(
                        candidates = results,
                        selectedIds = results.filter { c -> c.selected && c.isDeletable }.map { c -> c.id }.toSet(),
                        lastScanAt = System.currentTimeMillis(),
                        scannedFolder = folder?.absolutePath,
                        lastCleanup = null,
                        lastArchive = null,
                        smartSuggest = suggest(results)
                    )
                }
                app.database.scanHistoryDao().insert(
                    ScanHistoryEntity(
                        timestamp = System.currentTimeMillis(),
                        durationMs = System.currentTimeMillis() - started,
                        filesScanned = progress.filesScanned,
                        totalBytesScanned = progress.bytesExamined,
                        cleanableFoundBytes = results.filter { it.isDeletable }.sumOf { it.size },
                        duplicatesFoundCount = progress.duplicatesFound
                    )
                )
            } catch (e: CancellationException) {
                _state.update { it.copy(scan = it.scan.copy(isScanning = false, phase = ScanPhase.CANCELLED)) }
                throw e
            }
        }
    }

    fun cancelScan() {
        scanJob?.cancel()
    }

    fun toggle(candidate: StorageCandidate) {
        if (!candidate.isDeletable) return
        _state.update {
            val ids = if (candidate.id in it.selectedIds) it.selectedIds - candidate.id else it.selectedIds + candidate.id
            it.copy(selectedIds = ids)
        }
    }

    fun setCategorySelected(category: FileCategory?, selected: Boolean) {
        _state.update { state ->
            val pool = if (category == null) state.candidates else state.inCategory(category)
            val ids = pool.filter { it.isDeletable }.map { it.id }.toSet()
            state.copy(selectedIds = if (selected) state.selectedIds + ids else state.selectedIds - ids)
        }
    }

    fun cleanSelected() = clean(_state.value.selectedCandidates, trigger = "MANUAL")

    fun quickClean() = clean(_state.value.quickCleanCandidates, trigger = "QUICK_CLEAN")

    /** Delete specific candidates (used by Smart Suggest). */
    fun deleteCandidates(ids: Set<String>) =
        clean(_state.value.candidates.filter { it.id in ids && it.isDeletable }, trigger = "SMART_SUGGEST")

    private fun clean(candidates: List<StorageCandidate>, trigger: String) {
        val targets = candidates.map { it.copy(selected = true) }
        if (targets.isEmpty() || _state.value.isCleaning) return
        viewModelScope.launch {
            _state.update { it.copy(isCleaning = true) }
            val result = cleanupEngine.executeCleanup(targets, userConfirmed = true)
            val removedIds = targets
                .filter { it.category == FileCategory.APP_CACHE || !File(it.path).exists() }
                .map { it.id }
                .toSet()
            val now = System.currentTimeMillis()
            if (result.itemsDeletedCount > 0) {
                app.database.cleanupDao().insert(
                    CleanupHistoryEntity(
                        timestamp = now,
                        bytesReclaimed = result.bytesReclaimed,
                        itemsCount = result.itemsDeletedCount,
                        categoriesCleaned = targets.filter { it.id in removedIds }.map { it.category.name }.distinct(),
                        triggeredBy = trigger
                    )
                )
            }
            _state.update {
                val remaining = pruneDuplicates(it.candidates.filterNot { c -> c.id in removedIds })
                it.copy(
                    candidates = remaining,
                    selectedIds = it.selectedIds - removedIds,
                    isCleaning = false,
                    lastCleanup = CompletedCleanup(result, now),
                    smartSuggest = suggest(remaining),
                    device = StorageAccess.deviceStorage()
                )
            }
        }
    }

    fun dismissCleanupResult() {
        _state.update { it.copy(lastCleanup = null) }
    }

    fun archiveCandidates(ids: Set<String>) {
        val targets = _state.value.candidates.filter { it.id in ids }
        if (targets.isEmpty() || _state.value.isArchiving) return
        viewModelScope.launch {
            _state.update { it.copy(isArchiving = true) }
            val result = runCatching { archiveEngine.archive(targets) }.getOrNull()
            if (result != null && result.archivedCount > 0) {
                app.database.cleanupDao().insert(
                    CleanupHistoryEntity(
                        timestamp = System.currentTimeMillis(),
                        bytesReclaimed = result.bytesSaved,
                        itemsCount = result.archivedCount,
                        categoriesCleaned = targets.filter { it.id in result.archivedIds }.map { it.category.name }.distinct(),
                        triggeredBy = "ARCHIVE"
                    )
                )
            }
            _state.update {
                val remaining = pruneDuplicates(it.candidates.filterNot { c -> result != null && c.id in result.archivedIds })
                it.copy(
                    candidates = remaining,
                    selectedIds = it.selectedIds - (result?.archivedIds ?: emptySet()),
                    isArchiving = false,
                    lastArchive = result,
                    smartSuggest = suggest(remaining),
                    device = StorageAccess.deviceStorage()
                )
            }
        }
    }

    fun dismissArchiveResult() {
        _state.update { it.copy(lastArchive = null) }
    }

    fun clearAppCache(onDone: (Long) -> Unit) {
        viewModelScope.launch {
            val cache = listOfNotNull(app.cacheDir, app.externalCacheDir)
            val before = cache.sumOf { dir -> dir.walkTopDown().filter { it.isFile }.sumOf { it.length() } }
            cache.forEach { dir -> dir.listFiles()?.forEach { it.deleteRecursively() } }
            _state.update { it.copy(candidates = it.candidates.filterNot { c -> c.category == FileCategory.APP_CACHE }) }
            onDone(before)
        }
    }

    fun loadHealth() {
        refreshDevice()
        if (!_state.value.health.hasUsageAccess) return
        viewModelScope.launch {
            _state.update { it.copy(health = it.health.copy(loadingApps = true)) }
            val apps = healthRepository.heaviestApps()
            _state.update { it.copy(health = it.health.copy(apps = apps, loadingApps = false)) }
        }
    }

    fun updateSettings(transform: (AutoCleanSettings) -> AutoCleanSettings) {
        viewModelScope.launch {
            val updated = transform(app.settingsDataStore.settingsFlow.first())
            app.settingsDataStore.updateSettings(updated)
            app.workScheduler.schedulePeriodicMaintenance(updated)
        }
    }

    fun clearHistory() {
        viewModelScope.launch {
            app.database.cleanupDao().clearAll()
            app.database.scanHistoryDao().clearAll()
        }
    }
}
