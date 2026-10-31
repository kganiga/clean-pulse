package com.cleanpulse.app.work

import android.app.NotificationManager
import android.text.format.Formatter
import androidx.core.app.NotificationManagerCompat
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.cleanpulse.app.CleanPulseApplication
import com.cleanpulse.app.R
import com.cleanpulse.app.data.cleanup.SafeCleanupEngine
import com.cleanpulse.app.data.local.CleanupHistoryEntity
import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.scanner.FileScanner
import com.cleanpulse.app.data.storage.StorageAccess
import kotlinx.coroutines.flow.first

class AutoCleanWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val app = applicationContext as? CleanPulseApplication ?: return Result.failure()
        val settings = app.settingsDataStore.settingsFlow.first()

        if (!settings.enabled || !StorageAccess.hasFullAccess(app)) {
            return Result.success()
        }
        // Only clean when storage is actually filling up.
        if (StorageAccess.deviceStorage().usedFraction * 100 < settings.storageThresholdPercent) {
            return Result.success()
        }

        // 1. Run low-overhead scan for authorized safe categories only
        val scanner = FileScanner(app)
        val candidates = scanner.scanStorage(
            oldFileDaysThreshold = settings.maxFileAgeDays,
            largeFileBytesThreshold = settings.largeFileThresholdMb * 1024L * 1024L
        )

        // Filter ONLY categories the user explicitly enabled for scheduled cleanup
        val safeScheduledCandidates = candidates.filter { item ->
            when (item.category) {
                FileCategory.APP_CACHE -> settings.categories.appCache
                FileCategory.TEMP_FILES -> settings.categories.tempFiles
                FileCategory.EMPTY_DIRS -> settings.categories.emptyDirs
                FileCategory.APP_APKS -> settings.categories.apks
                // For safety, never delete user downloads or duplicates in background without review
                FileCategory.OLD_DOWNLOADS -> false
                FileCategory.DUPLICATES -> false
                FileCategory.LARGE_FILES -> false
            }
        }.map { it.copy(selected = true) }

        if (safeScheduledCandidates.isNotEmpty()) {
            val cleanupEngine = SafeCleanupEngine(app)
            val result = cleanupEngine.executeCleanup(
                candidatesToDelete = safeScheduledCandidates,
                userConfirmed = true
            )

            // Save record to Room database
            app.database.cleanupDao().insert(
                CleanupHistoryEntity(
                    timestamp = System.currentTimeMillis(),
                    bytesReclaimed = result.bytesReclaimed,
                    itemsCount = result.itemsDeletedCount,
                    categoriesCleaned = safeScheduledCandidates.map { it.category.name }.distinct(),
                    triggeredBy = "WORKMANAGER_SCHEDULED"
                )
            )

            // Notify user with accurate reclaimed statistics
            if (result.bytesReclaimed > 0 &&
                NotificationManagerCompat.from(app).areNotificationsEnabled()
            ) {
                sendReclaimedNotification(app, result.bytesReclaimed)
            }
        }

        return Result.success()
    }

    private fun sendReclaimedNotification(context: Context, bytes: Long) {
        val notification = NotificationCompat.Builder(context, CleanPulseApplication.CHANNEL_STORAGE_ALERTS)
            .setSmallIcon(R.drawable.ic_stat_cleanpulse)
            .setContentTitle("Scheduled Storage Maintenance")
            .setContentText("CleanPulse freed ${Formatter.formatShortFileSize(context, bytes)} of cache and leftover files.")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setAutoCancel(true)
            .build()

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(101, notification)
    }
}
