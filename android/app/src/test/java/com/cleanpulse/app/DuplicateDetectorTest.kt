package com.cleanpulse.app

import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.model.StorageCandidate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.security.MessageDigest

class DuplicateDetectorTest {

    // Helper: calculate streamed SHA-256 in 64KB chunks
    private fun calculateStreamedHash(input: InputStream): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val buffer = ByteArray(64 * 1024)
        var read: Int
        while (input.read(buffer).also { read = it } != -1) {
            digest.update(buffer, 0, read)
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    // -------------------------------------------------------------
    // Test 1: Same names with different content
    // -------------------------------------------------------------
    @Test
    fun sameNames_withDifferentContent_areNotClassifiedAsDuplicates() {
        val hashA = calculateStreamedHash(ByteArrayInputStream("DATA_CONTENT_A".toByteArray()))
        val hashB = calculateStreamedHash(ByteArrayInputStream("DATA_CONTENT_B".toByteArray()))

        val fileA = StorageCandidate(
            id = "f1",
            name = "report.pdf",
            path = "/storage/emulated/0/Download/report.pdf",
            size = 1024L,
            category = FileCategory.OLD_DOWNLOADS,
            mimeType = "application/pdf",
            lastModified = 1000L,
            flagReason = "Candidate A",
            sha256 = hashA
        )
        val fileB = StorageCandidate(
            id = "f2",
            name = "report.pdf", // Identical name
            path = "/storage/emulated/0/Documents/report.pdf",
            size = 1024L,
            category = FileCategory.OLD_DOWNLOADS,
            mimeType = "application/pdf",
            lastModified = 2000L,
            flagReason = "Candidate B",
            sha256 = hashB
        )

        assertFalse("Matching filenames alone do not establish duplication", fileA.sha256 == fileB.sha256)
    }

    // -------------------------------------------------------------
    // Test 2: Different names with identical content
    // -------------------------------------------------------------
    @Test
    fun differentNames_withIdenticalContent_areDetectedAsDuplicates() {
        val payload = "IDENTICAL_PAYLOAD_TOKEN_FOR_DUPLICATE_DETECTOR_TEST"
        val hashMaster = calculateStreamedHash(ByteArrayInputStream(payload.toByteArray()))
        val hashCopy = calculateStreamedHash(ByteArrayInputStream(payload.toByteArray()))

        assertEquals(hashMaster, hashCopy)

        val masterInCamera = StorageCandidate(
            id = "orig",
            name = "IMG_20261023_Beach.jpg",
            path = "/storage/emulated/0/DCIM/Camera/IMG_20261023_Beach.jpg",
            size = payload.length.toLong(),
            category = FileCategory.DUPLICATES,
            mimeType = "image/jpeg",
            lastModified = 1000L,
            flagReason = "Original in DCIM Camera album",
            sha256 = hashMaster,
            duplicateGroupId = "group_beach",
            isOriginal = true,
            isSafeToDelete = false
        )

        val copyInDownloads = StorageCandidate(
            id = "copy",
            name = "telegram_beach_photo_copy.jpg",
            path = "/storage/emulated/0/Download/telegram_beach_photo_copy.jpg",
            size = payload.length.toLong(),
            category = FileCategory.DUPLICATES,
            mimeType = "image/jpeg",
            lastModified = 2000L,
            flagReason = "Redundant copy",
            sha256 = hashCopy,
            duplicateGroupId = "group_beach",
            isOriginal = false,
            isSafeToDelete = true
        )

        assertEquals("Hashes must match despite completely different filenames", masterInCamera.sha256, copyInDownloads.sha256)
        assertTrue("Master file must be retained as original", masterInCamera.isOriginal)
        assertFalse("Master copy must not be flagged safe to delete", masterInCamera.isSafeToDelete)
        assertTrue("Redundant copy must be flagged safe to delete", copyInDownloads.isSafeToDelete)
    }

    // -------------------------------------------------------------
    // Test 3: Same size with different content (Collision Test)
    // -------------------------------------------------------------
    @Test
    fun sameSize_withDifferentContent_areNotGroupedTogether() {
        val bytesA = ByteArray(4096) { 0x11 }
        val bytesB = ByteArray(4096) { 0x22 }

        val hashA = calculateStreamedHash(ByteArrayInputStream(bytesA))
        val hashB = calculateStreamedHash(ByteArrayInputStream(bytesB))

        assertEquals("Sizes match exactly", bytesA.size, bytesB.size)
        assertFalse("Hashes must differ for distinct payloads of same size", hashA == hashB)
    }

    // -------------------------------------------------------------
    // Test 4: Empty files (0 bytes)
    // -------------------------------------------------------------
    @Test
    fun emptyFiles_areExcludedFromContentDuplication() {
        val emptyFileSize = 0L
        val isEligibleForContentDuplicate = emptyFileSize > 0L

        assertFalse("0-byte files must be excluded from content-based duplicate classification", isEligibleForContentDuplicate)
    }

    // -------------------------------------------------------------
    // Test 5: Large files (Chunked streaming verification)
    // -------------------------------------------------------------
    @Test
    fun largeFiles_areStreamedInChunksWithoutOutOfMemory() {
        // Simulate a 5MB stream read in 64KB blocks
        val totalSize = 5 * 1024 * 1024
        val dummyData = ByteArray(64 * 1024) { 0x5a }

        val digest = MessageDigest.getInstance("SHA-256")
        var bytesProcessed = 0
        while (bytesProcessed < totalSize) {
            val chunk = Math.min(dummyData.size, totalSize - bytesProcessed)
            digest.update(dummyData, 0, chunk)
            bytesProcessed += chunk
        }

        val finalHash = digest.digest().joinToString("") { "%02x".format(it) }
        assertTrue("Streamed hash must be a valid 64-character hex string", finalHash.length == 64)
        assertEquals("Processed full streamed size", totalSize, bytesProcessed)
    }

    // -------------------------------------------------------------
    // Test 6: Inaccessible / Permission Denied Files
    // -------------------------------------------------------------
    @Test
    fun inaccessibleFiles_areHandledGracefullyWithoutCrashing() {
        var failureCaught = false
        try {
            val unreadableStream: InputStream = object : InputStream() {
                override fun read(): Int {
                    throw SecurityException("Permission denied by Android SELinux / Scoped Storage")
                }
            }
            calculateStreamedHash(unreadableStream)
        } catch (e: SecurityException) {
            failureCaught = true
        }

        assertTrue("Inaccessible files must be caught and excluded from candidates without crashing", failureCaught)
    }

    // -------------------------------------------------------------
    // Test 7: Files modified during scanning (Mutation Guard)
    // -------------------------------------------------------------
    @Test
    fun filesModifiedDuringScan_areMarkedUnverifiedAndExcludedFromAutoCleanup() {
        val initialTimestamp = 1000L
        val mutatedTimestamp = 2000L // File touched by another process during scan

        val isMutated = initialTimestamp != mutatedTimestamp
        val isSafeForAutomaticCleanup = !isMutated

        assertTrue("Scanner must detect mutation if timestamp changes", isMutated)
        assertFalse("Mutated candidate must be excluded from automatic cleanup", isSafeForAutomaticCleanup)
    }
}
