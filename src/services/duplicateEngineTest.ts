import { DuplicateTestResult } from '../types';
import { detectDuplicates, RawFileSource, revalidateBeforeDeletion } from './duplicateEngine';

export async function runDuplicateEngineUnitTests(): Promise<DuplicateTestResult[]> {
  const results: DuplicateTestResult[] = [];

  // -------------------------------------------------------------
  // Test 1: Same names with different content
  // -------------------------------------------------------------
  {
    const files: RawFileSource[] = [
      {
        id: 't1_file_a',
        name: 'invoice_october.pdf',
        path: '/storage/emulated/0/Download/invoice_october.pdf',
        size: 1024,
        lastModified: 1000,
        mimeType: 'application/pdf',
        isAccessible: true,
        contentGetter: async () => new Blob(['CONTENT_A_ALPHA_1234567890']),
      },
      {
        id: 't1_file_b',
        name: 'invoice_october.pdf', // Identical name
        path: '/storage/emulated/0/Documents/invoice_october.pdf',
        size: 1024, // Same size but different content
        lastModified: 2000,
        mimeType: 'application/pdf',
        isAccessible: true,
        contentGetter: async () => new Blob(['CONTENT_B_BRAVO_9876543210']),
      },
    ];

    const dups = await detectDuplicates(files);
    const passed = dups.length === 0;
    results.push({
      id: 'test_1',
      name: 'Same Names with Different Content',
      passed,
      scenario: 'Two files with identical names ("invoice_october.pdf") and sizes, but distinct content bytes.',
      expectedBehavior: 'Must NOT be classified as duplicates. Matching filenames alone do not establish duplication.',
      actualOutcome: passed
        ? 'Passed: SHA-256 hashes correctly differed; 0 duplicate groups returned.'
        : 'Failed: Incorrectly classified as duplicate.',
    });
  }

  // -------------------------------------------------------------
  // Test 2: Different names with identical content
  // -------------------------------------------------------------
  {
    const sharedContent = 'EXACT_IDENTICAL_BINARY_PAYLOAD_TOKEN_FOR_DUPLICATE_DETECTION_999';
    const files: RawFileSource[] = [
      {
        id: 't2_file_master',
        name: 'IMG_20261012_Beach.jpg',
        path: '/storage/emulated/0/DCIM/Camera/IMG_20261012_Beach.jpg',
        size: sharedContent.length,
        lastModified: 1000,
        mimeType: 'image/jpeg',
        isAccessible: true,
        contentGetter: async () => new Blob([sharedContent]),
      },
      {
        id: 't2_file_copy',
        name: 'photo_downloaded_from_telegram.jpg', // Totally different name & directory
        path: '/storage/emulated/0/Pictures/Telegram/photo_downloaded_from_telegram.jpg',
        size: sharedContent.length,
        lastModified: 2000,
        mimeType: 'image/jpeg',
        isAccessible: true,
        contentGetter: async () => new Blob([sharedContent]),
      },
    ];

    const dups = await detectDuplicates(files);
    const passed = dups.length === 1 && dups[0].members.length === 2 && dups[0].recommendedKeepId === 't2_file_master';
    results.push({
      id: 'test_2',
      name: 'Different Names with Identical Content',
      passed,
      scenario: 'Original in DCIM Camera and duplicate copy with totally different name in Telegram folder.',
      expectedBehavior: 'Must detect exact SHA-256 match and intelligently recommend preserving DCIM Camera master.',
      actualOutcome: passed
        ? `Passed: 1 duplicate group detected. Preserved ${dups[0].recommendedKeepReason}`
        : 'Failed: Did not identify match or failed keep recommendation.',
    });
  }

  // -------------------------------------------------------------
  // Test 3: Same size with different content (Collision Test)
  // -------------------------------------------------------------
  {
    const files: RawFileSource[] = [
      {
        id: 't3_a',
        name: 'archive_a.zip',
        path: '/storage/emulated/0/Download/archive_a.zip',
        size: 512,
        lastModified: 1000,
        mimeType: 'application/zip',
        isAccessible: true,
        contentGetter: async () => new Blob([new Uint8Array(512).fill(0xaa)]),
      },
      {
        id: 't3_b',
        name: 'archive_b.zip',
        path: '/storage/emulated/0/Download/archive_b.zip',
        size: 512, // Identical 512 bytes, different content
        lastModified: 2000,
        mimeType: 'application/zip',
        isAccessible: true,
        contentGetter: async () => new Blob([new Uint8Array(512).fill(0xbb)]),
      },
    ];

    const dups = await detectDuplicates(files);
    const passed = dups.length === 0;
    results.push({
      id: 'test_3',
      name: 'Same Size with Different Content',
      passed,
      scenario: 'Two files with exact identical size (512 bytes) but completely different byte contents.',
      expectedBehavior: 'Size match triggers hash stage, but differing hashes prevent false positive.',
      actualOutcome: passed
        ? 'Passed: Disambiguated by SHA-256; 0 duplicate groups reported.'
        : 'Failed: False positive duplicate detected.',
    });
  }

  // -------------------------------------------------------------
  // Test 4: Empty files (0 bytes)
  // -------------------------------------------------------------
  {
    const files: RawFileSource[] = [
      {
        id: 't4_zero_1',
        name: 'empty1.txt',
        path: '/storage/emulated/0/Documents/empty1.txt',
        size: 0,
        lastModified: 1000,
        mimeType: 'text/plain',
        isAccessible: true,
        contentGetter: async () => new Blob([]),
      },
      {
        id: 't4_zero_2',
        name: 'empty2.txt',
        path: '/storage/emulated/0/Documents/empty2.txt',
        size: 0,
        lastModified: 2000,
        mimeType: 'text/plain',
        isAccessible: true,
        contentGetter: async () => new Blob([]),
      },
    ];

    const dups = await detectDuplicates(files);
    const passed = dups.length === 0;
    results.push({
      id: 'test_4',
      name: 'Empty Files (0 Bytes)',
      passed,
      scenario: 'Two empty 0-byte text files.',
      expectedBehavior: 'Must exclude 0-byte files from content-based duplication to prevent unintended mass deletion.',
      actualOutcome: passed
        ? 'Passed: 0-byte files excluded from content duplicate engine.'
        : 'Failed: 0-byte files incorrectly grouped.',
    });
  }

  // -------------------------------------------------------------
  // Test 5: Large files (Chunked streaming verification)
  // -------------------------------------------------------------
  {
    // Generate a simulated 10MB chunked buffer
    const largeSize = 10 * 1024 * 1024;
    const chunkA = new Uint8Array(largeSize);
    chunkA.fill(0x42);

    const files: RawFileSource[] = [
      {
        id: 't5_large_orig',
        name: '4K_video_take1.mp4',
        path: '/storage/emulated/0/DCIM/Camera/4K_video_take1.mp4',
        size: largeSize,
        lastModified: 1000,
        mimeType: 'video/mp4',
        isAccessible: true,
        contentGetter: async () => new Blob([chunkA]),
      },
      {
        id: 't5_large_copy',
        name: '4K_video_take1_backup.mp4',
        path: '/storage/emulated/0/Download/4K_video_take1_backup.mp4',
        size: largeSize,
        lastModified: 2000,
        mimeType: 'video/mp4',
        isAccessible: true,
        contentGetter: async () => new Blob([chunkA]),
      },
    ];

    const dups = await detectDuplicates(files);
    const passed = dups.length === 1 && dups[0].exactByteSize === largeSize;
    results.push({
      id: 'test_5',
      name: 'Large Files Streaming Verification',
      passed,
      scenario: '10 MB video files processed using incremental chunked stream hashing.',
      expectedBehavior: 'Processes without OutOfMemory error; correctly identifies identical byte hash.',
      actualOutcome: passed
        ? `Passed: Incremental SHA-256 matched large file group of ${largeSize} bytes.`
        : 'Failed: Streaming hash mismatch.',
    });
  }

  // -------------------------------------------------------------
  // Test 6: Inaccessible / Permission Denied Files
  // -------------------------------------------------------------
  {
    const files: RawFileSource[] = [
      {
        id: 't6_normal',
        name: 'doc_valid.pdf',
        path: '/storage/emulated/0/Documents/doc_valid.pdf',
        size: 2048,
        lastModified: 1000,
        mimeType: 'application/pdf',
        isAccessible: true,
        contentGetter: async () => new Blob(['VALID_DATA_STRING']),
      },
      {
        id: 't6_locked',
        name: 'doc_locked.pdf',
        path: '/storage/emulated/0/Android/data/com.protected/doc_locked.pdf',
        size: 2048,
        lastModified: 1000,
        mimeType: 'application/pdf',
        isAccessible: false, // Access revoked / restricted
        contentGetter: async () => {
          throw new Error('EACCES: Permission denied');
        },
      },
    ];

    const dups = await detectDuplicates(files);
    const passed = dups.length === 0;
    results.push({
      id: 'test_6',
      name: 'Inaccessible / Permission Denied Files',
      passed,
      scenario: 'File with revoked SAF access or permission denial during scanning.',
      expectedBehavior: 'Must gracefully skip inaccessible file without crashing scan or marking unverified duplicate.',
      actualOutcome: passed
        ? 'Passed: Inaccessible candidate filtered safely; batch completed without crash.'
        : 'Failed: Error thrown or unverified duplicate marked.',
    });
  }

  // -------------------------------------------------------------
  // Test 7: Files Modified During Scanning (Mutation Detection)
  // -------------------------------------------------------------
  {
    const files: RawFileSource[] = [
      {
        id: 't7_file1',
        name: 'active_db_backup.sqlite',
        path: '/storage/emulated/0/Documents/active_db_backup.sqlite',
        size: 4096,
        lastModified: 1000,
        mimeType: 'application/x-sqlite3',
        isAccessible: true,
        isBeingModified: true, // File being written to by another process
        contentGetter: async () => new Blob(['INITIAL_BYTES_MUTATING']),
      },
      {
        id: 't7_file2',
        name: 'active_db_backup (1).sqlite',
        path: '/storage/emulated/0/Download/active_db_backup (1).sqlite',
        size: 4096,
        lastModified: 1000,
        mimeType: 'application/x-sqlite3',
        isAccessible: true,
        isBeingModified: false,
        contentGetter: async () => new Blob(['INITIAL_BYTES_MUTATING']),
      },
    ];

    const dups = await detectDuplicates(files);
    // Group must be marked UNVERIFIED_MUTATED and copies must NOT be auto-selected for deletion!
    const group = dups[0];
    const isUnverified = group && group.verificationStatus === 'UNVERIFIED_MUTATED';
    const noneAutoSelected = group && group.members.every((m) => !m.selectedForDeletion);

    // Also test pre-deletion revalidation
    const preDeleteCheck = await revalidateBeforeDeletion(
      {
        id: 't7_file1',
        name: 'active_db_backup.sqlite',
        path: '/storage/emulated/0/Documents/active_db_backup.sqlite',
        size: 4096,
        lastModified: 1000,
        initialModifiedTimestamp: 1000,
        hasMutated: true,
        isOriginal: false,
        selectedForDeletion: false,
        locationCategory: 'DOCUMENTS',
      },
      4096,
      1000
    );

    const passed = isUnverified && noneAutoSelected && !preDeleteCheck.isValid;
    results.push({
      id: 'test_7',
      name: 'Files Modified During Scanning (Mutation Guard)',
      passed,
      scenario: 'File timestamps or content in-flight modified while scanner is traversing.',
      expectedBehavior: 'Must mark group UNVERIFIED_MUTATED, exclude from auto-cleanup, and block pre-deletion validation.',
      actualOutcome: passed
        ? 'Passed: Mutation detected. Status marked UNVERIFIED_MUTATED and pre-deletion revalidation rejected.'
        : 'Failed: Did not catch mutation or allowed deletion of mutating file.',
    });
  }

  return results;
}
