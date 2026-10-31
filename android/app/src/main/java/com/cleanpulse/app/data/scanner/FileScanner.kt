package com.cleanpulse.app.data.scanner

import android.content.Context
import android.os.Environment
import android.webkit.MimeTypeMap
import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.model.ScanPhase
import com.cleanpulse.app.data.model.ScanProgressState
import com.cleanpulse.app.data.model.StorageCandidate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest
import java.util.concurrent.TimeUnit
import kotlin.coroutines.coroutineContext

/**
 * Walks shared storage (/storage/emulated/0) and classifies files into cleanup categories.
 * Requires "All files access" on Android 11+ (see StorageAccess).
 */
class FileScanner(private val context: Context) {

    private val _scanProgress = MutableStateFlow(ScanProgressState())
    val scanProgress: StateFlow<ScanProgressState> = _scanProgress.asStateFlow()

    /**
     * @param folder scan only this folder (custom folder scan); null scans all of shared storage.
     */
    suspend fun scanStorage(
        oldFileDaysThreshold: Int = 60,
        largeFileBytesThreshold: Long = 50 * 1024 * 1024L,
        folder: File? = null
    ): List<StorageCandidate> = withContext(Dispatchers.IO) {
        val root = Environment.getExternalStorageDirectory()
        val start = folder ?: root
        val downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        val now = System.currentTimeMillis()
        val oldThresholdMillis = TimeUnit.DAYS.toMillis(oldFileDaysThreshold.toLong())

        val byPath = linkedMapOf<String, StorageCandidate>()
        val filesBySize = mutableMapOf<Long, MutableList<File>>()
        var filesScanned = 0
        var bytesExamined = 0L

        _scanProgress.value = ScanProgressState(isScanning = true, phase = ScanPhase.INDEXING_FILES)

        // 1. App-owned caches: always safe, rebuilt on demand.
        val cacheBytes = if (folder != null) 0L else listOfNotNull(context.cacheDir, context.externalCacheDir).sumOf { directorySize(it) }
        if (cacheBytes > 0) {
            byPath[context.cacheDir.absolutePath] = StorageCandidate(
                id = "app_cache",
                name = "CleanPulse cache",
                path = context.cacheDir.absolutePath,
                size = cacheBytes,
                category = FileCategory.APP_CACHE,
                mimeType = "application/octet-stream",
                lastModified = now,
                flagReason = "Temporary data this app created. Rebuilt automatically when needed.",
                requiresSafPrompt = false,
                selected = true
            )
        }

        // 2. Index shared storage.
        if (start.canRead()) {
            val walker = start.walkTopDown().onEnter { dir -> !isExcludedDirectory(root, dir) }
            for (file in walker) {
                coroutineContext.ensureActive()
                if (file == start) continue

                if (file.isDirectory) {
                    val children = file.list()
                    if (children != null && children.isEmpty() && !isProtectedDirectory(root, file)) {
                        byPath[file.absolutePath] = candidate(
                            file, FileCategory.EMPTY_DIRS, "Folder with nothing in it.",
                            mimeType = "inode/directory", selected = true
                        )
                    }
                    continue
                }

                filesScanned++
                val size = file.length()
                bytesExamined += size
                if (filesScanned % 50 == 0) {
                    _scanProgress.value = _scanProgress.value.copy(
                        currentPath = file.path.removePrefix(root.path),
                        filesScanned = filesScanned,
                        bytesExamined = bytesExamined
                    )
                }

                // Zero- and tiny files are never content duplicates worth reporting.
                if (size > MIN_DUPLICATE_BYTES) {
                    filesBySize.getOrPut(size) { mutableListOf() }.add(file)
                }

                val ext = file.extension.lowercase()
                val age = now - file.lastModified()
                val inDownloads = file.path.startsWith(downloadDir.path + File.separator)

                val entry = when {
                    ext == "apk" || ext == "apks" || ext == "xapk" -> candidate(
                        file, FileCategory.APP_APKS,
                        "App installer. Deleting it does not uninstall the app.",
                        mimeType = "application/vnd.android.package-archive", selected = true
                    )
                    ext in TEMP_EXTENSIONS || file.name.startsWith(".trashed-") -> candidate(
                        file, FileCategory.TEMP_FILES,
                        if (file.name.startsWith(".trashed-")) "Item left in a gallery trash folder."
                        else "Temporary, partial or log file left behind by an app.",
                        selected = true
                    )
                    inDownloads && age > oldThresholdMillis -> candidate(
                        file, FileCategory.OLD_DOWNLOADS,
                        "Downloaded ${TimeUnit.MILLISECONDS.toDays(age)} days ago.",
                        isSafeToDelete = false
                    )
                    size >= largeFileBytesThreshold -> candidate(
                        file, FileCategory.LARGE_FILES,
                        "Large file. Review before deleting.",
                        isSafeToDelete = false
                    )
                    else -> null
                }
                if (entry != null) byPath[file.absolutePath] = entry
            }
        }

        // 3. Duplicates: same size -> same first 64 KB -> same full SHA-256.
        val sizeGroups = filesBySize.values.filter { it.size > 1 }
        _scanProgress.value = _scanProgress.value.copy(
            phase = ScanPhase.HASHING_DUPLICATES,
            filesScanned = filesScanned,
            bytesExamined = bytesExamined,
            totalEstimatedFiles = sizeGroups.size,
            progressPercent = 0f
        )

        var duplicatesFound = 0
        sizeGroups.forEachIndexed { index, sameSize ->
            coroutineContext.ensureActive()
            _scanProgress.value = _scanProgress.value.copy(
                currentPath = sameSize.first().name,
                progressPercent = index.toFloat() / sizeGroups.size
            )

            val byFullHash = sameSize
                .groupBy { headHash(it) }
                .values
                .filter { it.size > 1 }
                .flatMap { sameHead ->
                    sameHead.mapNotNull { file ->
                        runCatching { Sha256Hasher.calculate(file) to file }.getOrNull()
                    }
                }
                .groupBy({ it.first }, { it.second })

            for ((sha256, group) in byFullHash) {
                if (group.size < 2) continue
                val original = group.minWith(compareBy<File>({ originalRank(root, it) }, { it.lastModified() }))
                duplicatesFound += group.size - 1
                for (file in group) {
                    val isOriginal = file == original
                    byPath[file.absolutePath] = candidate(
                        file, FileCategory.DUPLICATES,
                        if (isOriginal) "Kept: the copy CleanPulse treats as the original."
                        else "Exact copy of ${original.name} (SHA-256 match).",
                        isSafeToDelete = !isOriginal,
                        selected = !isOriginal
                    ).copy(sha256 = sha256, duplicateGroupId = sha256.take(12), isOriginal = isOriginal)
                }
            }
        }

        val candidates = byPath.values.toList()
        _scanProgress.value = _scanProgress.value.copy(
            phase = ScanPhase.COMPLETED,
            isScanning = false,
            currentPath = "",
            duplicatesFound = duplicatesFound,
            cleanableFoundBytes = candidates.filter { it.isSafeToDelete }.sumOf { it.size },
            progressPercent = 1f
        )
        candidates
    }

    private fun candidate(
        file: File,
        category: FileCategory,
        reason: String,
        mimeType: String = mimeTypeOf(file),
        isSafeToDelete: Boolean = true,
        selected: Boolean = false
    ) = StorageCandidate(
        id = file.absolutePath,
        name = file.name,
        path = file.absolutePath,
        size = if (file.isDirectory) 0L else file.length(),
        category = category,
        mimeType = mimeType,
        lastModified = file.lastModified(),
        flagReason = reason,
        isSafeToDelete = isSafeToDelete,
        requiresSafPrompt = false,
        selected = selected
    )

    /** Lower rank wins as the "original" of a duplicate group. Camera roll beats copies elsewhere. */
    private fun originalRank(root: File, file: File): Int {
        val relative = file.path.removePrefix(root.path).lowercase()
        return when {
            relative.startsWith("/dcim/") -> 0
            relative.startsWith("/pictures/") || relative.startsWith("/movies/") ||
                relative.startsWith("/music/") || relative.startsWith("/documents/") -> 1
            relative.startsWith("/download/") -> 3
            else -> 2
        }
    }

    private fun headHash(file: File): String = runCatching {
        val digest = MessageDigest.getInstance("SHA-256")
        val buffer = ByteArray(HEAD_BYTES)
        FileInputStream(file).use { input ->
            val read = input.read(buffer)
            if (read > 0) digest.update(buffer, 0, read)
        }
        digest.digest().joinToString("") { "%02x".format(it) }
    }.getOrDefault("unreadable:${file.path}")

    private fun isExcludedDirectory(root: File, dir: File): Boolean {
        if (dir == root) return false
        val relative = dir.path.removePrefix(root.path)
        return relative == "/Android" || relative.startsWith("/Android/") || dir.name == ".thumbnails"
    }

    /** Standard top-level folders apps expect to exist, even when empty. */
    private fun isProtectedDirectory(root: File, dir: File): Boolean =
        dir.parentFile == root || dir.name.startsWith(".")

    private fun mimeTypeOf(file: File): String =
        MimeTypeMap.getSingleton().getMimeTypeFromExtension(file.extension.lowercase())
            ?: "application/octet-stream"

    private fun directorySize(dir: File): Long =
        dir.walkTopDown().filter { it.isFile }.sumOf { it.length() }

    companion object {
        private const val MIN_DUPLICATE_BYTES = 1024L
        private const val HEAD_BYTES = 64 * 1024
        private val TEMP_EXTENSIONS = setOf("tmp", "temp", "part", "crdownload", "partial", "dmp")
    }
}
