package com.cleanpulse.app

import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.model.StorageCandidate
import com.cleanpulse.app.domain.SmartSuggestAction
import com.cleanpulse.app.domain.SmartSuggestEngine
import org.junit.Assert.*
import org.junit.Test
import java.util.concurrent.TimeUnit

class SmartSuggestEngineTest {
    private val engine = SmartSuggestEngine(dormancyThresholdDays = 90L)

    @Test
    fun testIgnoresFilesOpenedWithin90Days() {
        val now = System.currentTimeMillis()
        val recentFile = StorageCandidate(
            id = "recent_1",
            name = "Project_Notes.pdf",
            path = "/storage/emulated/0/Documents/Project_Notes.pdf",
            size = 1024 * 1024,
            category = FileCategory.OLD_DOWNLOADS,
            mimeType = "application/pdf",
            lastModified = now - TimeUnit.DAYS.toMillis(40),
            lastAccessedMs = now - TimeUnit.DAYS.toMillis(20),
            flagReason = "Recent file",
            isSafeToDelete = false,
            selected = false
        )

        val summary = engine.analyzeCandidates(listOf(recentFile), currentTimeMs = now)
        assertEquals(0, summary.totalDormantFiles)
    }

    @Test
    fun testSuggestsArchiveForDormantDocuments() {
        val now = System.currentTimeMillis()
        val dormantDoc = StorageCandidate(
            id = "doc_1",
            name = "Financial_Statement_Q1.pdf",
            path = "/storage/emulated/0/Documents/Financial_Statement_Q1.pdf",
            size = 15 * 1024 * 1024,
            category = FileCategory.OLD_DOWNLOADS,
            mimeType = "application/pdf",
            lastModified = now - TimeUnit.DAYS.toMillis(120),
            lastAccessedMs = now - TimeUnit.DAYS.toMillis(115),
            flagReason = "Old document",
            isSafeToDelete = false,
            selected = false
        )

        val summary = engine.analyzeCandidates(listOf(dormantDoc), currentTimeMs = now)
        assertEquals(1, summary.totalDormantFiles)
        assertEquals(SmartSuggestAction.ARCHIVE, summary.suggestions[0].suggestedAction)
        assertEquals(115L, summary.suggestions[0].daysDormant)
    }

    @Test
    fun testSuggestsDeletionForDormantApk() {
        val now = System.currentTimeMillis()
        val dormantApk = StorageCandidate(
            id = "apk_1",
            name = "OldAppInstaller_v2.apk",
            path = "/storage/emulated/0/Download/OldAppInstaller_v2.apk",
            size = 45 * 1024 * 1024,
            category = FileCategory.APP_APKS,
            mimeType = "application/vnd.android.package-archive",
            lastModified = now - TimeUnit.DAYS.toMillis(100),
            lastAccessedMs = now - TimeUnit.DAYS.toMillis(98),
            flagReason = "Old APK",
            isSafeToDelete = true,
            selected = true
        )

        val summary = engine.analyzeCandidates(listOf(dormantApk), currentTimeMs = now)
        assertEquals(1, summary.totalDormantFiles)
        assertEquals(SmartSuggestAction.DELETE, summary.suggestions[0].suggestedAction)
    }
}
