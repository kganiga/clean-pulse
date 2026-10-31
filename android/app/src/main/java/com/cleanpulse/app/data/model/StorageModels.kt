package com.cleanpulse.app.data.model

import android.net.Uri

enum class FileCategory(val displayName: String) {
    DUPLICATES("Duplicate Files"),
    OLD_DOWNLOADS("Old Downloads"),
    TEMP_FILES("Temporary & Residual"),
    APP_APKS("Old APK Installers"),
    EMPTY_DIRS("Empty Folders"),
    APP_CACHE("App Cache"),
    LARGE_FILES("Large Files for Review")
}

data class StorageCandidate(
    val id: String,
    val name: String,
    val path: String,
    val uri: Uri? = null,
    val size: Long,
    val category: FileCategory,
    val mimeType: String,
    val lastModified: Long,
    val lastAccessedMs: Long = 0L,
    val flagReason: String,
    val sha256: String? = null,
    val duplicateGroupId: String? = null,
    val isOriginal: Boolean = false,
    val isSafeToDelete: Boolean = true,
    val requiresSafPrompt: Boolean = false,
    val selected: Boolean = false
)

data class StorageBreakdown(
    val totalBytes: Long,
    val usedBytes: Long,
    val freeBytes: Long,
    val cleanableBytes: Long,
    val guaranteedReclaimableBytes: Long,
    val largeFilesCount: Int,
    val largeFilesBytes: Long,
    val duplicateCount: Int,
    val duplicateBytes: Long,
    val oldDownloadsCount: Int,
    val oldDownloadsBytes: Long,
    val tempFilesCount: Int,
    val tempFilesBytes: Long,
    val apksCount: Int,
    val apksBytes: Long,
    val emptyDirsCount: Int,
    val appCacheBytes: Long
)

data class ScanProgressState(
    val isScanning: Boolean = false,
    val currentPath: String = "",
    val filesScanned: Int = 0,
    val totalEstimatedFiles: Int = 0,
    val bytesExamined: Long = 0L,
    val progressPercent: Float = 0f,
    val phase: ScanPhase = ScanPhase.IDLE,
    val duplicatesFound: Int = 0,
    val cleanableFoundBytes: Long = 0L
)

enum class ScanPhase {
    IDLE,
    INDEXING_FILES,
    HASHING_DUPLICATES,
    EVALUATING_POLICIES,
    COMPLETED,
    CANCELLED
}
