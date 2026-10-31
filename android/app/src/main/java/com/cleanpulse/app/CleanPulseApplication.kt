package com.cleanpulse.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import com.cleanpulse.app.data.local.CleanPulseDatabase
import com.cleanpulse.app.data.local.SettingsDataStore
import com.cleanpulse.app.work.CleanPulseWorkScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class CleanPulseApplication : Application() {

    val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val database: CleanPulseDatabase by lazy {
        CleanPulseDatabase.getInstance(this)
    }

    val settingsDataStore: SettingsDataStore by lazy {
        SettingsDataStore(this)
    }

    val workScheduler: CleanPulseWorkScheduler by lazy {
        CleanPulseWorkScheduler(this)
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        syncScheduledWork()
    }

    private fun createNotificationChannels() {
        val channel = NotificationChannel(
            CHANNEL_STORAGE_ALERTS,
            getString(R.string.channel_storage_alerts),
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = getString(R.string.channel_storage_alerts_desc)
        }
        getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
    }

    private fun syncScheduledWork() {
        applicationScope.launch {
            val settings = settingsDataStore.settingsFlow.first()
            if (settings.enabled) {
                workScheduler.schedulePeriodicMaintenance(settings)
            } else {
                workScheduler.cancelPeriodicMaintenance()
            }
        }
    }

    companion object {
        const val CHANNEL_STORAGE_ALERTS = "cleanpulse_storage_alerts"
    }
}
