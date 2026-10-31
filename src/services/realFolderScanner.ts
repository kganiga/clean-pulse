import { StorageCandidate, FileCategory } from '../types';
import { calculateSha256 } from './sha256';

/**
 * Scans a real directory picked by the user via File System Access API (window.showDirectoryPicker)
 * Similar to how Android Storage Access Framework (SAF) grants tree URI access to DocumentFile.
 */
export async function scanRealDirectory(
  dirHandle: FileSystemDirectoryHandle,
  signal: AbortSignal,
  onProgress: (currentPath: string, filesScanned: number, bytesExamined: number) => void
): Promise<StorageCandidate[]> {
  const candidates: StorageCandidate[] = [];
  const filesBySize = new Map<number, { handle: FileSystemFileHandle; path: string; file: File }[]>();
  let filesScanned = 0;
  let bytesExamined = 0;

  // Recursive directory walker
  async function walk(handle: FileSystemDirectoryHandle, currentPath: string) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    // Check for empty directory
    let childCount = 0;
    // Iterate entries
    for await (const [name, entry] of handle.entries()) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      childCount++;
      const entryPath = `${currentPath}/${name}`;

      if (entry.kind === 'directory') {
        await walk(entry as FileSystemDirectoryHandle, entryPath);
      } else if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        filesScanned++;
        bytesExamined += file.size;

        onProgress(entryPath, filesScanned, bytesExamined);

        // Group by exact file size for duplicate candidate pre-filtering
        if (file.size > 0) {
          const list = filesBySize.get(file.size) || [];
          list.push({ handle: fileHandle, path: entryPath, file });
          filesBySize.set(file.size, list);
        }

        const ext = name.split('.').pop()?.toLowerCase() || '';
        const now = Date.now();
        const ageDays = (now - file.lastModified) / (1000 * 60 * 60 * 24);

        // Categorize candidates based on real Android criteria
        if (ext === 'apk') {
          candidates.push({
            id: `real_${Math.random().toString(36).substring(2, 9)}`,
            name,
            path: entryPath,
            size: file.size,
            category: 'app_apks',
            mimeType: 'application/vnd.android.package-archive',
            lastModified: file.lastModified,
            flagReason: 'Package installation archive file found in directory.',
            isSafeToDelete: true,
            requiresSafPrompt: true,
            selected: true,
            realFileHandle: fileHandle,
          });
        } else if (ext === 'tmp' || ext === 'temp') {
          candidates.push({
            id: `real_${Math.random().toString(36).substring(2, 9)}`,
            name,
            path: entryPath,
            size: file.size,
            category: 'tmp_files',
            mimeType: file.type || 'application/x-temp',
            lastModified: file.lastModified,
            flagReason: 'Stale temporary buffer file (.tmp) safe to reclaim.',
            isSafeToDelete: true,
            requiresSafPrompt: true,
            selected: true,
            realFileHandle: fileHandle,
          });
        } else if (
          ext === 'log' ||
          ext === 'part' ||
          ext === 'crdownload' ||
          ext === 'download' ||
          ext === 'dmp' ||
          name.startsWith('.trashed')
        ) {
          candidates.push({
            id: `real_${Math.random().toString(36).substring(2, 9)}`,
            name,
            path: entryPath,
            size: file.size,
            category: 'temp_files',
            mimeType: file.type || 'text/plain',
            lastModified: file.lastModified,
            flagReason:
              ext === 'log'
                ? 'Orphaned application crash or trace log.'
                : 'Interrupted partial download or expired cache item.',
            isSafeToDelete: true,
            requiresSafPrompt: true,
            selected: true,
            realFileHandle: fileHandle,
          });
        } else if (ageDays > 60 && currentPath.toLowerCase().includes('download')) {
          candidates.push({
            id: `real_${Math.random().toString(36).substring(2, 9)}`,
            name,
            path: entryPath,
            size: file.size,
            category: 'old_downloads',
            mimeType: file.type || 'application/octet-stream',
            lastModified: file.lastModified,
            flagReason: `Downloaded ${Math.round(ageDays)} days ago and untouched.`,
            isSafeToDelete: true,
            requiresSafPrompt: true,
            selected: true,
            realFileHandle: fileHandle,
          });
        } else if (file.size > 25 * 1024 * 1024) {
          // Large file > 25MB
          candidates.push({
            id: `real_${Math.random().toString(36).substring(2, 9)}`,
            name,
            path: entryPath,
            size: file.size,
            category: 'large_files',
            mimeType: file.type || 'application/octet-stream',
            lastModified: file.lastModified,
            flagReason: 'Large file exceeding 25 MB. Review for manual cleanup.',
            isSafeToDelete: false,
            requiresSafPrompt: true,
            selected: false,
            realFileHandle: fileHandle,
          });
        }
      }
    }

    if (childCount === 0 && currentPath !== '') {
      candidates.push({
        id: `real_${Math.random().toString(36).substring(2, 9)}`,
        name: currentPath.split('/').pop() || 'empty_folder',
        path: currentPath,
        size: 0,
        category: 'empty_dirs',
        mimeType: 'inode/directory',
        lastModified: Date.now(),
        flagReason: 'Empty directory with 0 files.',
        isSafeToDelete: true,
        requiresSafPrompt: true,
        selected: true,
      });
    }
  }

  await walk(dirHandle, dirHandle.name);

  // Now perform chunked SHA-256 comparison on size collisions
  for (const [size, matches] of filesBySize.entries()) {
    if (matches.length > 1 && size > 1024) {
      // Calculate hash for all matching files
      const hashes = new Map<string, typeof matches>();
      for (const item of matches) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        const hash = await calculateSha256(item.file, signal);
        const group = hashes.get(hash) || [];
        group.push(item);
        hashes.set(hash, group);
      }

      for (const [sha256, group] of hashes.entries()) {
        if (group.length > 1) {
          const groupId = `real_dup_${sha256.substring(0, 10)}`;
          // Sort by lastModified: oldest is considered original
          group.sort((a, b) => a.file.lastModified - b.file.lastModified);

          group.forEach((item, index) => {
            const isOriginal = index === 0;
            // Check if not already in candidates list
            const existing = candidates.find(c => c.path === item.path);
            if (existing) {
              existing.category = 'duplicates';
              existing.sha256 = sha256;
              existing.duplicateGroupId = groupId;
              existing.isOriginal = isOriginal;
              existing.selected = !isOriginal;
              existing.flagReason = isOriginal
                ? 'Original earliest file in duplicate group.'
                : 'Exact SHA-256 byte match of earlier file.';
            } else {
              candidates.push({
                id: `real_dup_${Math.random().toString(36).substring(2, 9)}`,
                name: item.handle.name,
                path: item.path,
                size: item.file.size,
                category: 'duplicates',
                mimeType: item.file.type || 'application/octet-stream',
                lastModified: item.file.lastModified,
                flagReason: isOriginal
                  ? 'Original earliest file in duplicate group.'
                  : 'Exact SHA-256 byte match of earlier file.',
                sha256,
                duplicateGroupId: groupId,
                isOriginal,
                isSafeToDelete: !isOriginal,
                requiresSafPrompt: true,
                selected: !isOriginal,
                realFileHandle: item.handle,
              });
            }
          });
        }
      }
    }
  }

  return candidates;
}
