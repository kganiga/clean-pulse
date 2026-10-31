package com.cleanpulse.app.data.cleanup

import android.content.Context
import android.media.MediaScannerConnection
import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.model.StorageCandidate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

data class CleanupResult(
    val bytesReclaimed: Long,
    val itemsDeletedCount: Int,
    val failedCount: Int,
    val freedByAppCache: Long,
    val freedByUserFiles: Long
)

class SafeCleanupEngine(private val context: Context) {

    /**
     * Executes safe deletion on approved candidates.
     * Categorized:
     * A. App-owned cache: safely deleted directly.
     * B. User-approved files: deleted via File.delete (needs All files access).
     */
    suspend fun executeCleanup(
        candidatesToDelete: List<StorageCandidate>,
        userConfirmed: Boolean
    ): CleanupResult = withContext(Dispatchers.IO) {
        if (!userConfirmed) {
            throw IllegalStateException("Cleanup requested without explicit user confirmation.")
        }

        var bytesReclaimed = 0L
        var itemsDeleted = 0
        var failedCount = 0
        var freedByAppCache = 0L
        var freedByUserFiles = 0L
        val removedPaths = mutableListOf<String>()

        for (candidate in candidatesToDelete) {
            if (!candidate.selected) continue

            when (candidate.category) {
                FileCategory.APP_CACHE -> {
                    val cleared = clearAppCache()
                    if (cleared > 0) {
                        bytesReclaimed += cleared
                        freedByAppCache += cleared
                        itemsDeleted++
                    }
                }

                FileCategory.DUPLICATES -> {
                    // Safety check: Never delete the designated original copy!
                    if (candidate.isOriginal) {
                        failedCount++
                        continue
                    }
                    val deleted = deleteTargetFile(candidate, removedPaths)
                    if (deleted) {
                        bytesReclaimed += candidate.size
                        freedByUserFiles += candidate.size
                        itemsDeleted++
                    } else {
                        failedCount++
                    }
                }

                FileCategory.TEMP_FILES,
                FileCategory.APP_APKS,
                FileCategory.OLD_DOWNLOADS,
                FileCategory.EMPTY_DIRS,
                FileCategory.LARGE_FILES -> {
                    val deleted = deleteTargetFile(candidate, removedPaths)
                    if (deleted) {
                        bytesReclaimed += candidate.size
                        freedByUserFiles += candidate.size
                        itemsDeleted++
                    } else {
                        failedCount++
                    }
                }
            }
        }

        if (removedPaths.isNotEmpty()) {
            MediaScannerConnection.scanFile(context, removedPaths.toTypedArray(), null, null)
        }

        CleanupResult(
            bytesReclaimed = bytesReclaimed,
            itemsDeletedCount = itemsDeleted,
            failedCount = failedCount,
            freedByAppCache = freedByAppCache,
            freedByUserFiles = freedByUserFiles
        )
    }

    private fun deleteTargetFile(candidate: StorageCandidate, removedPaths: MutableList<String>): Boolean {
        return try {
            val file = File(candidate.path)
            if (file.exists()) {
                // Mutation guard: skip anything that changed since the scan.
                if (file.lastModified() != candidate.lastModified) return false
                val deleted = if (file.isDirectory) {
                    // Only ever remove directories that are still empty.
                    file.list()?.isEmpty() == true && file.delete()
                } else {
                    file.length() == candidate.size && file.delete()
                }
                if (deleted) removedPaths += file.absolutePath
                deleted
            } else {
                false
            }
        } catch (e: Exception) {
            false
        }
    }

    private fun clearAppCache(): Long {
        return try {
            var reclaimed = 0L
            listOfNotNull(context.cacheDir, context.externalCacheDir).forEach { dir ->
                dir.listFiles()?.forEach { file ->
                    val size = file.walkTopDown().filter { it.isFile }.sumOf { it.length() }
                    if (file.deleteRecursively()) reclaimed += size
                }
            }
            reclaimed
        } catch (e: Exception) {
            0L
        }
    }
}
