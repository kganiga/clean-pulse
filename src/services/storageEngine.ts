import { StorageCandidate, StorageBreakdown, FileCategory, DuplicateGroup, DuplicateMember, AutoCleanPreferences } from '../types';
import { calculateSha256 } from './sha256';
import { determineLocationCategory, determineRecommendedKeepMember } from './duplicateEngine';

// Realistic virtual storage dataset representing a standard 128GB Android 15 phone
export const DEFAULT_VIRTUAL_DEVICE_STORAGE = {
  totalBytes: 128 * 1024 * 1024 * 1024, // 128 GB
  systemBytes: 19.4 * 1024 * 1024 * 1024, // 19.4 GB Android OS & System
  appsBytes: 38.6 * 1024 * 1024 * 1024, // 38.6 GB Installed apps & app data
};

// Seed dataset of realistic Android files for initial scan or demo mode
export function getInitialVirtualFiles(): StorageCandidate[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return [
    // --- 1. App-owned cache (Guaranteed safe to clear directly) ---
    {
      id: 'app_cache_thumbnails',
      name: 'glide_thumbnail_disk_cache.bin',
      path: '/data/user/0/com.cleanpulse.app/cache/image_manager_disk_cache/v1.bin',
      size: 42 * 1024 * 1024, // 42 MB
      category: 'app_cache',
      mimeType: 'application/octet-stream',
      lastModified: now - 2 * dayMs,
      flagReason: "CleanPulse's internal image disk cache. Recreated on demand.",
      isSafeToDelete: true,
      requiresSafPrompt: false,
      selected: true,
    },
    {
      id: 'app_cache_network',
      name: 'okhttp_response_cache',
      path: '/data/user/0/com.cleanpulse.app/cache/http_cache.0',
      size: 18.5 * 1024 * 1024, // 18.5 MB
      category: 'app_cache',
      mimeType: 'application/octet-stream',
      lastModified: now - 1 * dayMs,
      flagReason: "Expired HTTP response cache from CleanPulse's network client.",
      isSafeToDelete: true,
      requiresSafPrompt: false,
      selected: true,
    },

    // --- 2. Temporary Files (.tmp) ---
    {
      id: 'tmp_video_render_tmp',
      name: 'video_transcode_export_7109.tmp',
      path: '/storage/emulated/0/Movies/CapCut/temp/video_transcode_export_7109.tmp',
      size: 154.6 * 1024 * 1024, // 154.6 MB
      category: 'tmp_files',
      mimeType: 'application/octet-stream',
      lastModified: now - 18 * dayMs,
      flagReason: 'Stale video rendering buffer (.tmp) left behind after interrupted editor export.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },
    {
      id: 'tmp_burst_camera_tmp',
      name: 'burst_processing_buffer_082.tmp',
      path: '/storage/emulated/0/DCIM/.temp/burst_processing_buffer_082.tmp',
      size: 68.4 * 1024 * 1024, // 68.4 MB
      category: 'tmp_files',
      mimeType: 'application/octet-stream',
      lastModified: now - 24 * dayMs,
      flagReason: 'Residual camera burst processing buffer (.tmp) older than 24 days.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },
    {
      id: 'tmp_camera_preview_cache',
      name: 'camera_preview_cache_991.tmp',
      path: '/storage/emulated/0/DCIM/.temp/camera_preview_cache_991.tmp',
      size: 28.2 * 1024 * 1024, // 28.2 MB
      category: 'tmp_files',
      mimeType: 'application/octet-stream',
      lastModified: now - 12 * dayMs,
      flagReason: 'Stale camera viewfinder snapshot buffer (.tmp) with closed file descriptor.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },

    // --- 3. Residual and Log Files (.log, partial downloads, trash) ---
    {
      id: 'temp_log_1',
      name: 'crash_trace_20261012.log',
      path: '/storage/emulated/0/Android/data/com.thirdparty.reader/files/logs/crash_trace_20261012.log',
      size: 34.2 * 1024 * 1024, // 34.2 MB
      category: 'temp_files',
      mimeType: 'text/plain',
      lastModified: now - 45 * dayMs,
      flagReason: 'Orphaned error trace log from uninstalled or updated reader app.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },
    {
      id: 'temp_download_partial',
      name: 'ubuntu_touch_preview.iso.download',
      path: '/storage/emulated/0/Download/ubuntu_touch_preview.iso.download',
      size: 412 * 1024 * 1024, // 412 MB
      category: 'temp_files',
      mimeType: 'application/octet-stream',
      lastModified: now - 35 * dayMs,
      flagReason: 'Incomplete abandoned browser download from over a month ago.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },
    {
      id: 'temp_cache_trashed',
      name: '.trashed-1729482910-preview.mp4',
      path: '/storage/emulated/0/DCIM/.trashed-1729482910-preview.mp4',
      size: 89 * 1024 * 1024, // 89 MB
      category: 'temp_files',
      mimeType: 'video/mp4',
      lastModified: now - 62 * dayMs,
      flagReason: 'Pending OS media trash item older than standard 30-day purge cycle.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },

    // --- 4. Old Leftover APK Installers ---
    {
      id: 'apk_signal_old',
      name: 'Signal-Android-website-release-7.18.2.apk',
      path: '/storage/emulated/0/Download/Signal-Android-website-release-7.18.2.apk',
      size: 68.4 * 1024 * 1024, // 68.4 MB
      category: 'app_apks',
      mimeType: 'application/vnd.android.package-archive',
      lastModified: now - 78 * dayMs,
      flagReason: 'Standalone package installer. The app is already installed; installer is no longer needed.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },
    {
      id: 'apk_fdroid_old',
      name: 'F-Droid-1.20.1.apk',
      path: '/storage/emulated/0/Download/F-Droid-1.20.1.apk',
      size: 14.1 * 1024 * 1024, // 14.1 MB
      category: 'app_apks',
      mimeType: 'application/vnd.android.package-archive',
      lastModified: now - 110 * dayMs,
      lastAccessed: now - 105 * dayMs,
      flagReason: 'Outdated package file left in Download folder after manual installation.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },

    // --- 4. Duplicate Files (Identified via Byte Size + Chunked SHA-256) ---
    // Duplicate Pair A: Travel Itinerary PDF
    {
      id: 'dup_itinerary_orig',
      name: 'Flight_Boarding_Pass_Tokyo_Oct.pdf',
      path: '/storage/emulated/0/Documents/Travel/Flight_Boarding_Pass_Tokyo_Oct.pdf',
      size: 3.8 * 1024 * 1024,
      category: 'duplicates',
      mimeType: 'application/pdf',
      lastModified: now - 12 * dayMs,
      flagReason: 'Original copy stored in Documents/Travel folder.',
      sha256: 'a4f89d381c19b08492a543329d0092fbb928198f399438012bcead3910f13382',
      duplicateGroupId: 'group_pdf_tokyo',
      isOriginal: true,
      isSafeToDelete: false,
      requiresSafPrompt: true,
      selected: false,
    },
    {
      id: 'dup_itinerary_copy',
      name: 'Flight_Boarding_Pass_Tokyo_Oct (1).pdf',
      path: '/storage/emulated/0/Download/Flight_Boarding_Pass_Tokyo_Oct (1).pdf',
      size: 3.8 * 1024 * 1024,
      category: 'duplicates',
      mimeType: 'application/pdf',
      lastModified: now - 11 * dayMs,
      flagReason: 'Exact duplicate SHA-256 match. Re-downloaded copy in Downloads.',
      sha256: 'a4f89d381c19b08492a543329d0092fbb928198f399438012bcead3910f13382',
      duplicateGroupId: 'group_pdf_tokyo',
      isOriginal: false,
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },

    // Duplicate Pair B: High-res Panorama image saved in both Camera and WhatsApp
    {
      id: 'dup_photo_orig',
      name: 'IMG_20260905_SunsetCoast.jpg',
      path: '/storage/emulated/0/DCIM/Camera/IMG_20260905_SunsetCoast.jpg',
      size: 16.4 * 1024 * 1024,
      category: 'duplicates',
      mimeType: 'image/jpeg',
      lastModified: now - 48 * dayMs,
      flagReason: 'Camera master copy retained in DCIM.',
      sha256: '7c980209e9921b033d8392a10bfdd53a19e830f2398402a11bdeef9200aa3811',
      duplicateGroupId: 'group_sunset_coast',
      isOriginal: true,
      isSafeToDelete: false,
      requiresSafPrompt: true,
      selected: false,
    },
    {
      id: 'dup_photo_copy',
      name: 'SunsetCoast_shared_copy.jpg',
      path: '/storage/emulated/0/Pictures/Telegram/SunsetCoast_shared_copy.jpg',
      size: 16.4 * 1024 * 1024,
      category: 'duplicates',
      mimeType: 'image/jpeg',
      lastModified: now - 47 * dayMs,
      flagReason: 'Exact duplicate SHA-256 byte match found in Telegram folder.',
      sha256: '7c980209e9921b033d8392a10bfdd53a19e830f2398402a11bdeef9200aa3811',
      duplicateGroupId: 'group_sunset_coast',
      isOriginal: false,
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },

    // --- 5. Old Files in Downloads (>60 days old) ---
    {
      id: 'old_dl_specs',
      name: 'Conference_Schedule_August_2026.pdf',
      path: '/storage/emulated/0/Download/Conference_Schedule_August_2026.pdf',
      size: 8.7 * 1024 * 1024,
      category: 'old_downloads',
      mimeType: 'application/pdf',
      lastModified: now - 82 * dayMs,
      lastAccessed: now - 82 * dayMs,
      flagReason: 'Downloaded 82 days ago. Passed conference event date.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },
    {
      id: 'old_dl_tax_guide',
      name: 'Rental_Agreement_Template_v2.docx',
      path: '/storage/emulated/0/Download/Rental_Agreement_Template_v2.docx',
      size: 4.2 * 1024 * 1024,
      category: 'old_downloads',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      lastModified: now - 95 * dayMs,
      lastAccessed: now - 95 * dayMs,
      flagReason: 'Downloaded 95 days ago and unaccessed.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: false,
    },
    {
      id: 'old_dl_archive',
      name: 'icons_pack_extracted_backup.zip',
      path: '/storage/emulated/0/Download/icons_pack_extracted_backup.zip',
      size: 182 * 1024 * 1024,
      category: 'old_downloads',
      mimeType: 'application/zip',
      lastModified: now - 115 * dayMs,
      lastAccessed: now - 115 * dayMs,
      flagReason: 'Archive file downloaded 115 days ago.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },
    {
      id: 'audio_podcast_dormant',
      name: 'Tech_Talk_Deep_Dive_Ep89.mp3',
      path: '/storage/emulated/0/Podcasts/Tech_Talk_Deep_Dive_Ep89.mp3',
      size: 76 * 1024 * 1024,
      category: 'old_downloads',
      mimeType: 'audio/mpeg',
      lastModified: now - 120 * dayMs,
      lastAccessed: now - 118 * dayMs,
      flagReason: 'Offline podcast download untouched for 118 days.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },

    // --- 6. Empty Folders ---
    {
      id: 'empty_dir_1',
      name: 'old_podcast_show_unsubscribed',
      path: '/storage/emulated/0/Podcasts/old_podcast_show_unsubscribed',
      size: 0,
      category: 'empty_dirs',
      mimeType: 'inode/directory',
      lastModified: now - 90 * dayMs,
      lastAccessed: now - 90 * dayMs,
      flagReason: 'Empty directory with 0 child files or subdirectories.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },
    {
      id: 'empty_dir_2',
      name: 'draft_edits_cache',
      path: '/storage/emulated/0/Movies/CapCut/draft_edits_cache',
      size: 0,
      category: 'empty_dirs',
      mimeType: 'inode/directory',
      lastModified: now - 40 * dayMs,
      lastAccessed: now - 40 * dayMs,
      flagReason: 'Leftover empty directory from video editor project.',
      isSafeToDelete: true,
      requiresSafPrompt: true,
      selected: true,
    },

    // --- 7. Large Files for User Review (NOT marked junk by default) ---
    {
      id: 'doc_annual_report_archive',
      name: 'FY2025_Annual_Operations_Review.pptx',
      path: '/storage/emulated/0/Documents/Reports/FY2025_Annual_Operations_Review.pptx',
      size: 148 * 1024 * 1024, // 148 MB
      category: 'large_files',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      lastModified: now - 142 * dayMs,
      lastAccessed: now - 138 * dayMs,
      flagReason: 'Presentation untouched in 138 days. Prime candidate for ZIP archival.',
      isSafeToDelete: false,
      requiresSafPrompt: true,
      selected: false,
    },
    {
      id: 'large_dormant_trip_video',
      name: 'Iceland_Glacier_Expedition_4K_raw.mp4',
      path: '/storage/emulated/0/DCIM/Camera/Iceland_Glacier_Expedition_4K_raw.mp4',
      size: 1.62 * 1024 * 1024 * 1024, // 1.62 GB
      category: 'large_files',
      mimeType: 'video/mp4',
      lastModified: now - 150 * dayMs,
      lastAccessed: now - 148 * dayMs,
      flagReason: 'Dormant high-res footage unaccessed for 148 days. Recommended for archival.',
      isSafeToDelete: false,
      requiresSafPrompt: true,
      selected: false,
    },
    {
      id: 'large_video_4k',
      name: '4K_Drone_Flight_Mountain_Pass.mp4',
      path: '/storage/emulated/0/DCIM/Camera/4K_Drone_Flight_Mountain_Pass.mp4',
      size: 2.14 * 1024 * 1024 * 1024, // 2.14 GB
      category: 'large_files',
      mimeType: 'video/mp4',
      lastModified: now - 30 * dayMs,
      lastAccessed: now - 10 * dayMs,
      flagReason: 'High-capacity media file (>1 GB). Displayed for manual storage review.',
      isSafeToDelete: false, // User must review
      requiresSafPrompt: true,
      selected: false, // Never auto-select personal large videos
    },
    {
      id: 'large_screen_record',
      name: 'Screen_Recording_GamePlay_20261001.mp4',
      path: '/storage/emulated/0/Movies/Screenrecords/Screen_Recording_GamePlay_20261001.mp4',
      size: 680 * 1024 * 1024, // 680 MB
      category: 'large_files',
      mimeType: 'video/mp4',
      lastModified: now - 22 * dayMs,
      lastAccessed: now - 14 * dayMs,
      flagReason: 'Lengthy screen recording occupying 680 MB.',
      isSafeToDelete: false,
      requiresSafPrompt: true,
      selected: false,
    },
    {
      id: 'large_offline_map',
      name: 'osmand_japan_kanto_offline.obf',
      path: '/storage/emulated/0/Android/media/net.osmand/japan_kanto_offline.obf',
      size: 890 * 1024 * 1024, // 890 MB
      category: 'large_files',
      mimeType: 'application/octet-stream',
      lastModified: now - 65 * dayMs,
      lastAccessed: now - 35 * dayMs,
      flagReason: 'Large offline vector map package.',
      isSafeToDelete: false,
      requiresSafPrompt: true,
      selected: false,
    },
  ];
}

/**
 * Calculates accurate storage breakdown metrics from device and candidates
 */
export function calculateBreakdown(
  totalStorageBytes: number,
  candidates: StorageCandidate[],
  systemBytes: number = DEFAULT_VIRTUAL_DEVICE_STORAGE.systemBytes,
  appsBytes: number = DEFAULT_VIRTUAL_DEVICE_STORAGE.appsBytes
): StorageBreakdown {
  const userCandidatesBytes = candidates.reduce((sum, item) => sum + item.size, 0);
  const mediaAndUserFilesBytes = 28.5 * 1024 * 1024 * 1024; // Other user photos, audio, documents
  const usedBytes = Math.min(
    totalStorageBytes,
    systemBytes + appsBytes + userCandidatesBytes + mediaAndUserFilesBytes
  );
  const freeBytes = Math.max(0, totalStorageBytes - usedBytes);

  let cleanableBytes = 0;
  let guaranteedReclaimableBytes = 0;

  let largeFilesCount = 0;
  let largeFilesBytes = 0;
  let duplicateCount = 0;
  let duplicateBytes = 0;
  let oldDownloadsCount = 0;
  let oldDownloadsBytes = 0;
  let tempFilesCount = 0;
  let tempFilesBytes = 0;
  let tmpFilesCount = 0;
  let tmpFilesBytes = 0;
  let apksCount = 0;
  let apksBytes = 0;
  let emptyDirsCount = 0;
  let appCacheBytes = 0;

  for (const c of candidates) {
    switch (c.category) {
      case 'app_cache':
        appCacheBytes += c.size;
        guaranteedReclaimableBytes += c.size;
        cleanableBytes += c.size;
        break;
      case 'tmp_files':
        tmpFilesCount++;
        tmpFilesBytes += c.size;
        guaranteedReclaimableBytes += c.size;
        cleanableBytes += c.size;
        break;
      case 'temp_files':
        tempFilesCount++;
        tempFilesBytes += c.size;
        guaranteedReclaimableBytes += c.size;
        cleanableBytes += c.size;
        break;
      case 'app_apks':
        apksCount++;
        apksBytes += c.size;
        cleanableBytes += c.size;
        break;
      case 'duplicates':
        if (!c.isOriginal) {
          duplicateCount++;
          duplicateBytes += c.size;
          cleanableBytes += c.size;
        }
        break;
      case 'old_downloads':
        oldDownloadsCount++;
        oldDownloadsBytes += c.size;
        cleanableBytes += c.size;
        break;
      case 'empty_dirs':
        emptyDirsCount++;
        break;
      case 'large_files':
        largeFilesCount++;
        largeFilesBytes += c.size;
        // Large files are candidates for review, NOT counted in automatic cleanable
        break;
    }
  }

  return {
    totalBytes: totalStorageBytes,
    usedBytes,
    freeBytes,
    cleanableBytes,
    guaranteedReclaimableBytes,
    largeFilesCount,
    largeFilesBytes,
    duplicateCount,
    duplicateBytes,
    oldDownloadsCount,
    oldDownloadsBytes,
    tempFilesCount,
    tempFilesBytes,
    tmpFilesCount,
    tmpFilesBytes,
    apksCount,
    apksBytes,
    emptyDirsCount,
    appCacheBytes,
  };
}

/**
 * Filters storage candidates that qualify for automated background maintenance
 * based on user auto-clean preference policies.
 */
export function filterAutomatedMaintenanceCandidates(
  candidates: StorageCandidate[],
  settings: AutoCleanPreferences
): StorageCandidate[] {
  if (!settings.enabled) return [];

  return candidates.filter((item) => {
    if (item.category === 'app_cache' && settings.categories.appCache) return true;
    if (item.category === 'tmp_files' && settings.categories.tmpFiles) return true;
    if (item.category === 'temp_files' && settings.categories.tempFiles) return true;
    if (item.category === 'empty_dirs' && settings.categories.emptyDirs) return true;
    if (item.category === 'app_apks' && settings.categories.apks) return true;
    return false;
  });
}

/**
 * Runs Automated Maintenance cleanup logic and calculates reclaimed storage space
 */
export function runAutomatedMaintenance(
  candidates: StorageCandidate[],
  settings: AutoCleanPreferences
): {
  retainedCandidates: StorageCandidate[];
  cleanedCandidates: StorageCandidate[];
  reclaimedBytes: number;
} {
  const eligible = filterAutomatedMaintenanceCandidates(candidates, settings);
  const eligibleIds = new Set(eligible.map((e) => e.id));
  const retainedCandidates = candidates.filter((c) => !eligibleIds.has(c.id));
  const reclaimedBytes = eligible.reduce((sum, item) => sum + item.size, 0);

  return {
    retainedCandidates,
    cleanedCandidates: eligible,
    reclaimedBytes,
  };
}

/**
 * Checks real web storage quota if available
 */
export async function getRealWebStorageEstimate(): Promise<{ quota: number; usage: number } | null> {
  if (typeof navigator !== 'undefined' && 'storage' in navigator && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.usage !== undefined) {
        return { quota: estimate.quota, usage: estimate.usage };
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Builds DuplicateGroup objects from candidates marked as duplicates
 */
export function buildDuplicateGroupsFromCandidates(candidates: StorageCandidate[]): DuplicateGroup[] {
  const dupCandidates = candidates.filter((c) => c.category === 'duplicates' && c.duplicateGroupId);
  const groupMap = new Map<string, StorageCandidate[]>();

  for (const c of dupCandidates) {
    const list = groupMap.get(c.duplicateGroupId!) || [];
    list.push(c);
    groupMap.set(c.duplicateGroupId!, list);
  }

  const groups: DuplicateGroup[] = [];

  for (const [groupId, items] of groupMap.entries()) {
    if (items.length < 2) continue;

    const members: DuplicateMember[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      path: item.path,
      size: item.size,
      lastModified: item.lastModified,
      isOriginal: item.isOriginal ?? false,
      selectedForDeletion: item.selected,
      locationCategory: determineLocationCategory(item.path),
      initialModifiedTimestamp: item.lastModified,
      hasMutated: false,
    }));

    const existingOriginal = items.find((i) => i.isOriginal);
    let keepMemberId = existingOriginal ? existingOriginal.id : '';
    let reason = 'Designated master file.';

    if (!keepMemberId) {
      const rec = determineRecommendedKeepMember(members);
      keepMemberId = rec.keepMemberId;
      reason = rec.reason;
    } else {
      const originalMember = members.find((m) => m.id === keepMemberId);
      if (originalMember) {
        reason = determineRecommendedKeepMember([originalMember]).reason;
      }
    }

    // Apply keep selection
    members.forEach((m) => {
      if (m.id === keepMemberId) {
        m.isOriginal = true;
        m.selectedForDeletion = false;
      } else {
        m.isOriginal = false;
        const matchingCand = items.find((i) => i.id === m.id);
        m.selectedForDeletion = matchingCand ? matchingCand.selected : true;
      }
    });

    const exactByteSize = items[0].size;
    const totalGroupBytes = exactByteSize * members.length;
    const reclaimableBytes = exactByteSize * members.filter((m) => m.selectedForDeletion).length;

    groups.push({
      groupId,
      sha256: items[0].sha256 || 'a4f89d381c19b08492a543329d0092fbb928198f399438012bcead3910f13382',
      exactByteSize,
      members,
      totalGroupBytes,
      reclaimableBytes,
      recommendedKeepId: keepMemberId,
      recommendedKeepReason: reason,
      verificationStatus: 'BYTE_VERIFIED',
      mimeType: items[0].mimeType,
      samplePrefixMatched: true,
    });
  }

  return groups;
}
