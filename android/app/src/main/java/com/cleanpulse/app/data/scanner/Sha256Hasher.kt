package com.cleanpulse.app.data.scanner

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest
import kotlin.coroutines.coroutineContext

object Sha256Hasher {

    private const val BUFFER_SIZE = 64 * 1024 // 64 KB buffer

    /**
     * Calculates SHA-256 incrementally from a File without loading the entire file into memory.
     */
    suspend fun calculate(file: File): String = withContext(Dispatchers.IO) {
        val digest = MessageDigest.getInstance("SHA-256")
        val buffer = ByteArray(BUFFER_SIZE)
        FileInputStream(file).use { input ->
            var read: Int
            while (input.read(buffer).also { read = it } != -1) {
                coroutineContext.ensureActive() // Cooperate with cancellation
                digest.update(buffer, 0, read)
            }
        }
        digest.digest().joinToString("") { "%02x".format(it) }
    }
}
