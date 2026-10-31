package com.cleanpulse.app.work

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.cleanpulse.app.data.local.AutoCleanSettings
import java.util.concurrent.TimeUnit

class CleanPulseWorkScheduler(private val context: Context) {

    private val workManager = WorkManager.getInstance(context)

    fun schedulePeriodicMaintenance(settings: AutoCleanSettings) {
        if (!settings.enabled) {
            cancelPeriodicMaintenance()
            return
        }

        val repeatIntervalDays = when (settings.frequency) {
            "daily" -> 1L
            "three_days" -> 3L
            "weekly" -> 7L
            "monthly" -> 30L
            else -> 7L
        }

        // Constraints: require sufficient battery to prevent draining user device
        val constraints = Constraints.Builder()
            .apply {
                if (settings.requireBatteryNotLow) {
                    setRequiresBatteryNotLow(true)
                }
                if (settings.requireDeviceIdle) {
                    setRequiresDeviceIdle(true)
                }
            }
            .build()

        val periodicWorkRequest = PeriodicWorkRequestBuilder<AutoCleanWorker>(
            repeatIntervalDays,
            TimeUnit.DAYS,
            30L, // 30-minute flex interval
            TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .build()

        workManager.enqueueUniquePeriodicWork(
            WORK_NAME_PERIODIC_CLEANUP,
            ExistingPeriodicWorkPolicy.UPDATE,
            periodicWorkRequest
        )
    }

    fun cancelPeriodicMaintenance() {
        workManager.cancelUniqueWork(WORK_NAME_PERIODIC_CLEANUP)
    }

    companion object {
        const val WORK_NAME_PERIODIC_CLEANUP = "cleanpulse_periodic_maintenance"
    }
}
