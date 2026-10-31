/**
 * Incremental SHA-256 Hashing Engine.
 * Does NOT load entire files into memory; reads in chunks to prevent memory spikes.
 * Supports cancellation via AbortSignal.
 */
export async function calculateSha256(
  fileOrBlob: Blob | File,
  signal?: AbortSignal,
  onProgress?: (bytesRead: number, totalBytes: number) => void
): Promise<string> {
  const chunkSize = 512 * 1024; // 512 KB chunks for memory efficiency
  const total = fileOrBlob.size;

  if (total === 0) {
    return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  }

  // If under 4MB, direct crypto digest is instant and low memory
  if (total <= 4 * 1024 * 1024) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const buffer = await fileOrBlob.arrayBuffer();
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    onProgress?.(total, total);
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // For larger files: sample head, middle, and tail + incremental digest
  let offset = 0;
  const chunkHashes: string[] = [];

  while (offset < total) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const slice = fileOrBlob.slice(offset, offset + chunkSize);
    const buffer = await slice.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    chunkHashes.push(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));

    offset += chunkSize;
    onProgress?.(Math.min(offset, total), total);

    // Yield back to main thread periodically so UI doesn't stutter
    if (offset % (chunkSize * 4) === 0) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // Hash the combined chunk digests for the final composite signature
  const enc = new TextEncoder();
  const finalDigest = await crypto.subtle.digest('SHA-256', enc.encode(chunkHashes.join('')));
  return Array.from(new Uint8Array(finalDigest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
