package com.cleanpulse.app.data.cleanup

import android.content.Context
import android.media.MediaScannerConnection
import android.os.Environment
import com.cleanpulse.app.data.model.StorageCandidate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

data class ArchiveResult(
    val archive: File,
    val archivedCount: Int,
    val originalBytes: Long,
    val archiveBytes: Long,
    val archivedIds: Set<String>
) {
    val bytesSaved: Long get() = (originalBytes - archiveBytes).coerceAtLeast(0)
}

/**
 * Zips dormant files into Documents/CleanPulse Archives, then removes the originals
 * only after the archive has been written and closed successfully.
 */
class ArchiveEngine(private val context: Context) {

    suspend fun archive(candidates: List<StorageCandidate>): ArchiveResult = withContext(Dispatchers.IO) {
        val dir = File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS),
            "CleanPulse Archives"
        ).apply { mkdirs() }
        val stamp = SimpleDateFormat("yyyy-MM-dd_HHmm", Locale.US).format(Date())
        val archive = File(dir, "CleanPulse_Archive_$stamp.zip")

        val included = mutableListOf<Pair<StorageCandidate, File>>()
        val usedNames = mutableSetOf<String>()
        ZipOutputStream(archive.outputStream().buffered()).use { zip ->
            for (candidate in candidates) {
                val file = File(candidate.path)
                if (!file.isFile || file.lastModified() != candidate.lastModified) continue
                var name = file.name
                var n = 1
                while (!usedNames.add(name)) name = "${file.nameWithoutExtension} (${n++}).${file.extension}"
                zip.putNextEntry(ZipEntry(name).apply { time = file.lastModified() })
                FileInputStream(file).use { it.copyTo(zip, 64 * 1024) }
                zip.closeEntry()
                included += candidate to file
            }
        }

        val removed = included.filter { (_, file) -> file.delete() }
        MediaScannerConnection.scanFile(
            context,
            (removed.map { it.second.absolutePath } + archive.absolutePath).toTypedArray(),
            null,
            null
        )
        ArchiveResult(
            archive = archive,
            archivedCount = removed.size,
            originalBytes = removed.sumOf { it.first.size },
            archiveBytes = archive.length(),
            archivedIds = removed.map { it.first.id }.toSet()
        )
    }
}
