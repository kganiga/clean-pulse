package com.cleanpulse.app.data.scanner

import android.content.ContentResolver
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.security.MessageDigest
import kotlin.coroutines.coroutineContext

object Sha256Hasher {

    private const val BUFFER_SIZE = 64 * 1024 // 64 KB buffer

    /**
     * Calculates SHA-256 incrementally from a File without loading the entire file into memory.
     */
    suspend fun calculate(
        file: File,
        onProgress: ((bytesRead: Long, totalBytes: Long) -> Unit)? = null
    ): String = withContext(Dispatchers.IO) {
        val digest = MessageDigest.getInstance("SHA-256")
        val totalBytes = file.length()
        var bytesReadTotal = 0L

        FileInputStream(file).use { input ->
            processStream(input, digest, totalBytes, onProgress)
        }
    }

    /**
     * Calculates SHA-256 incrementally from an Android Content Uri via ContentResolver.
     */
    suspend fun calculate(
        contentResolver: ContentResolver,
        uri: Uri,
        totalBytes: Long,
        onProgress: ((bytesRead: Long, totalBytes: Long) -> Unit)? = null
    ): String = withContext(Dispatchers.IO) {
        val digest = MessageDigest.getInstance("SHA-256")

        contentResolver.openInputStream(uri)?.use { input ->
            processStream(input, digest, totalBytes, onProgress)
        } ?: throw IllegalArgumentException("Cannot open input stream for URI: $uri")
    }

    private suspend fun processStream(
        input: InputStream,
        digest: MessageDigest,
        totalBytes: Long,
        onProgress: ((bytesRead: Long, totalBytes: Long) -> Unit)?
    ): String {
        val buffer = ByteArray(BUFFER_SIZE)
        var bytesReadTotal = 0L
        var read: Int

        while (input.read(buffer).also { read = it } != -1) {
            coroutineContext.ensureActive() // Cooperate with cancellation
            digest.update(buffer, 0, read)
            bytesReadTotal += read
            onProgress?.invoke(bytesReadTotal, totalBytes)
        }

        val hashBytes = digest.digest()
        return hashBytes.joinToString("") { "%02x".format(it) }
    }
}
