package com.cleanpulse.app.domain

import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.model.StorageCandidate
import java.util.concurrent.TimeUnit

enum class SmartSuggestAction {
    ARCHIVE,
    DELETE
}

data class SmartSuggestion(
    val candidateId: String,
    val name: String,
    val path: String,
    val size: Long,
    val mimeType: String,
    val lastAccessedMs: Long,
    val daysDormant: Long,
    val suggestedAction: SmartSuggestAction,
    val confidenceScore: Int,
    val reason: String
)

data class SmartSuggestSummary(
    val totalDormantFiles: Int,
    val totalDormantBytes: Long,
    val archiveSuggestedBytes: Long,
    val deleteSuggestedBytes: Long,
    val suggestions: List<SmartSuggestion>
)

class SmartSuggestEngine(
    private val dormancyThresholdDays: Long = 90L
) {
    fun analyzeCandidates(
        candidates: List<StorageCandidate>,
        currentTimeMs: Long = System.currentTimeMillis()
    ): SmartSuggestSummary {
        val cutoffMs = currentTimeMs - TimeUnit.DAYS.toMillis(dormancyThresholdDays)
        val suggestions = mutableListOf<SmartSuggestion>()

        for (file in candidates) {
            if (file.category == FileCategory.APP_CACHE || file.size == 0L) continue

            val lastAccess = if (file.lastAccessedMs > 0) file.lastAccessedMs else file.lastModified
            if (lastAccess > cutoffMs) continue

            val daysDormant = TimeUnit.MILLISECONDS.toDays(currentTimeMs - lastAccess)
            val (action, reason, score) = evaluateAction(file, daysDormant)

            suggestions.add(
                SmartSuggestion(
                    candidateId = file.id,
                    name = file.name,
                    path = file.path,
                    size = file.size,
                    mimeType = file.mimeType,
                    lastAccessedMs = lastAccess,
                    daysDormant = daysDormant,
                    suggestedAction = action,
                    confidenceScore = score,
                    reason = reason
                )
            )
        }

        suggestions.sortByDescending { it.size }

        val archiveBytes = suggestions.filter { it.suggestedAction == SmartSuggestAction.ARCHIVE }.sumOf { it.size }
        val deleteBytes = suggestions.filter { it.suggestedAction == SmartSuggestAction.DELETE }.sumOf { it.size }

        return SmartSuggestSummary(
            totalDormantFiles = suggestions.size,
            totalDormantBytes = suggestions.sumOf { it.size },
            archiveSuggestedBytes = archiveBytes,
            deleteSuggestedBytes = deleteBytes,
            suggestions = suggestions
        )
    }

    private fun evaluateAction(file: StorageCandidate, daysDormant: Long): Triple<SmartSuggestAction, String, Int> {
        val lower = file.name.lowercase()
        return when {
            file.category == FileCategory.APP_APKS || lower.endsWith(".apk") ->
                Triple(SmartSuggestAction.DELETE, "Standalone installer unaccessed for $daysDormant days.", 96)
            file.category == FileCategory.TEMP_FILES || lower.endsWith(".tmp") || lower.endsWith(".log") ->
                Triple(SmartSuggestAction.DELETE, "Stale cache/buffer unaccessed for $daysDormant days.", 98)
            lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".pptx") ->
                Triple(SmartSuggestAction.ARCHIVE, "Document unopened in $daysDormant days. Archiving preserves file without data loss.", 92)
            lower.endsWith(".mp4") || lower.endsWith(".mov") ->
                Triple(SmartSuggestAction.ARCHIVE, "High-resolution video untouched for $daysDormant days.", 88)
            else ->
                Triple(if (file.isSafeToDelete) SmartSuggestAction.DELETE else SmartSuggestAction.ARCHIVE, "Dormant file unaccessed for $daysDormant days.", 80)
        }
    }
}
