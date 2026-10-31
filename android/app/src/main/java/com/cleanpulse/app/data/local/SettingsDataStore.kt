package com.cleanpulse.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "cleanpulse_settings")

// Scheduled cleanup deletes files without a review step, so it stays off until the user opts in.
data class AutoCleanSettings(
    val enabled: Boolean = false,
    val frequency: String = "weekly",
    val storageThresholdPercent: Int = 80,
    val maxFileAgeDays: Int = 60,
    val largeFileThresholdMb: Int = 50,
    val requireBatteryNotLow: Boolean = true,
    val requireDeviceIdle: Boolean = true,
    val categories: EnabledCategories = EnabledCategories()
)

data class EnabledCategories(
    val appCache: Boolean = true,
    val tmpFiles: Boolean = true,
    val tempFiles: Boolean = true,
    val emptyDirs: Boolean = true,
    val apks: Boolean = false,
    val oldDownloads: Boolean = false,
    val duplicates: Boolean = false
)

class SettingsDataStore(private val context: Context) {

    private object Keys {
        val ENABLED = booleanPreferencesKey("enabled")
        val FREQUENCY = stringPreferencesKey("frequency")
        val STORAGE_THRESHOLD = intPreferencesKey("storage_threshold")
        val MAX_FILE_AGE = intPreferencesKey("max_file_age")
        val LARGE_FILE_THRESHOLD = intPreferencesKey("large_file_threshold")
        val REQ_BATTERY_NOT_LOW = booleanPreferencesKey("req_battery_not_low")
        val REQ_DEVICE_IDLE = booleanPreferencesKey("req_device_idle")
        val CAT_APP_CACHE = booleanPreferencesKey("cat_app_cache")
        val CAT_TMP_FILES = booleanPreferencesKey("cat_tmp_files")
        val CAT_TEMP_FILES = booleanPreferencesKey("cat_temp_files")
        val CAT_EMPTY_DIRS = booleanPreferencesKey("cat_empty_dirs")
        val CAT_APKS = booleanPreferencesKey("cat_apks")
        val ONBOARDING_DONE = booleanPreferencesKey("onboarding_done")
    }

    val onboardingDone: Flow<Boolean> = context.dataStore.data.map { it[Keys.ONBOARDING_DONE] ?: false }

    suspend fun setOnboardingDone(done: Boolean) {
        context.dataStore.edit { it[Keys.ONBOARDING_DONE] = done }
    }

    val settingsFlow: Flow<AutoCleanSettings> = context.dataStore.data.map { prefs ->
        AutoCleanSettings(
            enabled = prefs[Keys.ENABLED] ?: false,
            frequency = prefs[Keys.FREQUENCY] ?: "weekly",
            storageThresholdPercent = prefs[Keys.STORAGE_THRESHOLD] ?: 80,
            maxFileAgeDays = prefs[Keys.MAX_FILE_AGE] ?: 60,
            largeFileThresholdMb = prefs[Keys.LARGE_FILE_THRESHOLD] ?: 50,
            requireBatteryNotLow = prefs[Keys.REQ_BATTERY_NOT_LOW] ?: true,
            requireDeviceIdle = prefs[Keys.REQ_DEVICE_IDLE] ?: true,
            categories = EnabledCategories(
                appCache = prefs[Keys.CAT_APP_CACHE] ?: true,
                tmpFiles = prefs[Keys.CAT_TMP_FILES] ?: true,
                tempFiles = prefs[Keys.CAT_TEMP_FILES] ?: true,
                emptyDirs = prefs[Keys.CAT_EMPTY_DIRS] ?: true,
                apks = prefs[Keys.CAT_APKS] ?: false
            )
        )
    }

    suspend fun updateSettings(settings: AutoCleanSettings) {
        context.dataStore.edit { prefs ->
            prefs[Keys.ENABLED] = settings.enabled
            prefs[Keys.FREQUENCY] = settings.frequency
            prefs[Keys.STORAGE_THRESHOLD] = settings.storageThresholdPercent
            prefs[Keys.MAX_FILE_AGE] = settings.maxFileAgeDays
            prefs[Keys.LARGE_FILE_THRESHOLD] = settings.largeFileThresholdMb
            prefs[Keys.REQ_BATTERY_NOT_LOW] = settings.requireBatteryNotLow
            prefs[Keys.REQ_DEVICE_IDLE] = settings.requireDeviceIdle
            prefs[Keys.CAT_APP_CACHE] = settings.categories.appCache
            prefs[Keys.CAT_TMP_FILES] = settings.categories.tmpFiles
            prefs[Keys.CAT_TEMP_FILES] = settings.categories.tempFiles
            prefs[Keys.CAT_EMPTY_DIRS] = settings.categories.emptyDirs
            prefs[Keys.CAT_APKS] = settings.categories.apks
        }
    }
}
