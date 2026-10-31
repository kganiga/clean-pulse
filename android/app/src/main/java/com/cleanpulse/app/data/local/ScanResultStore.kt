package com.cleanpulse.app.data.local

import android.content.Context
import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.model.StorageCandidate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

data class SavedScan(val scannedAt: Long, val folder: String?, val candidates: List<StorageCandidate>)

/** Keeps the latest scan results on disk so they survive the app being closed or updated. */
class ScanResultStore(context: Context) {

    private val file = File(context.filesDir, "last_scan.json")

    suspend fun save(scan: SavedScan) = withContext(Dispatchers.IO) {
        val items = JSONArray()
        scan.candidates.forEach { c ->
            items.put(
                JSONObject()
                    .put("id", c.id)
                    .put("name", c.name)
                    .put("path", c.path)
                    .put("size", c.size)
                    .put("category", c.category.name)
                    .put("mimeType", c.mimeType)
                    .put("lastModified", c.lastModified)
                    .put("flagReason", c.flagReason)
                    .put("sha256", c.sha256 ?: JSONObject.NULL)
                    .put("duplicateGroupId", c.duplicateGroupId ?: JSONObject.NULL)
                    .put("isOriginal", c.isOriginal)
                    .put("isSafeToDelete", c.isSafeToDelete)
                    .put("selected", c.selected)
            )
        }
        val json = JSONObject()
            .put("scannedAt", scan.scannedAt)
            .put("folder", scan.folder ?: JSONObject.NULL)
            .put("candidates", items)
        val tmp = File(file.parentFile, "${file.name}.tmp")
        tmp.writeText(json.toString())
        tmp.renameTo(file)
    }

    /** Returns the saved scan, dropping files that were deleted or changed since. */
    suspend fun load(): SavedScan? = withContext(Dispatchers.IO) {
        if (!file.exists()) return@withContext null
        runCatching {
            val json = JSONObject(file.readText())
            val items = json.getJSONArray("candidates")
            val candidates = (0 until items.length()).mapNotNull { i ->
                val o = items.getJSONObject(i)
                val category = FileCategory.valueOf(o.getString("category"))
                val path = o.getString("path")
                val lastModified = o.getLong("lastModified")
                if (category != FileCategory.APP_CACHE) {
                    val f = File(path)
                    if (!f.exists() || f.lastModified() != lastModified) return@mapNotNull null
                }
                StorageCandidate(
                    id = o.getString("id"),
                    name = o.getString("name"),
                    path = path,
                    size = o.getLong("size"),
                    category = category,
                    mimeType = o.getString("mimeType"),
                    lastModified = lastModified,
                    flagReason = o.getString("flagReason"),
                    sha256 = o.optString("sha256").takeUnless { o.isNull("sha256") },
                    duplicateGroupId = o.optString("duplicateGroupId").takeUnless { o.isNull("duplicateGroupId") },
                    isOriginal = o.getBoolean("isOriginal"),
                    isSafeToDelete = o.getBoolean("isSafeToDelete"),
                    selected = o.getBoolean("selected")
                )
            }
            // A duplicate whose other copies are gone is no longer a duplicate.
            val groupSizes = candidates.filter { it.category == FileCategory.DUPLICATES }.groupingBy { it.duplicateGroupId }.eachCount()
            SavedScan(
                scannedAt = json.getLong("scannedAt"),
                folder = json.optString("folder").takeUnless { json.isNull("folder") },
                candidates = candidates.filterNot { it.category == FileCategory.DUPLICATES && (groupSizes[it.duplicateGroupId] ?: 0) < 2 }
            )
        }.getOrNull()
    }
}
