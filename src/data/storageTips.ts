export interface StorageTip {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: 'Browser' | 'Cloud Photos' | 'Messaging' | 'Apps' | 'Media' | 'System';
  potentialSavings: string; // e.g. "1.5 – 3.8 GB"
  difficulty: 'Quick (1 min)' | 'Easy (2 mins)' | 'Moderate (5 mins)';
  steps: string[];
  systemSettingPath?: string;
}

export const STORAGE_TIPS: StorageTip[] = [
  {
    id: 'tip_browser_cache',
    title: 'Clear Browser Cache & Offline Site Data',
    tagline: 'Web browsers accumulate cached images and scripts that can quickly hog gigabytes.',
    description:
      'Browsers like Chrome, Firefox, and Samsung Internet store web pages, images, and video fragments locally. Clearing cached files leaves passwords and cookies intact while reclaiming massive space.',
    category: 'Browser',
    potentialSavings: '800 MB – 2.5 GB',
    difficulty: 'Quick (1 min)',
    steps: [
      'Open your mobile browser (e.g. Chrome or Samsung Internet).',
      'Tap the three dots menu (⋮) → Settings → Privacy & Security.',
      'Tap "Clear browsing data".',
      'Select "Cached images and files" (leave saved passwords unchecked).',
      'Tap "Clear data".',
    ],
    systemSettingPath: 'Chrome → Settings → Privacy & Security → Clear browsing data',
  },
  {
    id: 'tip_cloud_photos',
    title: 'Back up Photos to Cloud & Free Up Device Storage',
    tagline: 'High-res camera photos and 4K videos are often the biggest storage consumer.',
    description:
      'Once your pictures and videos are securely backed up to Google Photos, OneDrive, or Dropbox, you can safely remove the local on-device original copies without losing access to them.',
    category: 'Cloud Photos',
    potentialSavings: '4.0 – 15+ GB',
    difficulty: 'Easy (2 mins)',
    steps: [
      'Open the Google Photos or cloud backup app on your device.',
      'Tap your profile avatar in the top-right corner.',
      'Verify that "Backup complete" is displayed.',
      'Tap "Free up space on this device" (or "Free up X.X GB").',
      'Confirm the deletion of backed-up local media.',
    ],
    systemSettingPath: 'Google Photos → Profile Icon → Free up space',
  },
  {
    id: 'tip_chat_auto_download',
    title: 'Disable WhatsApp & Telegram Auto-Media Downloads',
    tagline: 'Chat groups automatically download memes, videos, and documents into internal storage.',
    description:
      'By default, messaging apps automatically download every incoming photo and video. Setting media downloads to manual Wi-Fi only or on-tap keeps unwanted forwarded files off your phone.',
    category: 'Messaging',
    potentialSavings: '1.2 – 5.0 GB',
    difficulty: 'Easy (2 mins)',
    steps: [
      'Open WhatsApp → Tap Settings (⋮) → Storage and data.',
      'Under "Media auto-download", tap "When using mobile data" and uncheck all boxes.',
      'Tap "When connected on Wi-Fi" and uncheck "Videos" and "Documents".',
      'In Telegram: Settings → Data and Storage → Disable "Automatic media download".',
    ],
    systemSettingPath: 'WhatsApp → Settings → Storage and data → Media auto-download',
  },
  {
    id: 'tip_unused_apps',
    title: 'Archive or Uninstall Unused Apps & Games',
    tagline: 'Modern 3D games and heavy utility apps take 1GB to 15GB each.',
    description:
      'Android 15 features automatic app archiving, which preserves your personal data while removing the bulky app binaries. Or manually uninstall games you haven’t launched this month.',
    category: 'Apps',
    potentialSavings: '3.0 – 10+ GB',
    difficulty: 'Moderate (5 mins)',
    steps: [
      'Open Google Play Store → Tap your profile avatar → Manage apps & device.',
      'Tap the "Manage" tab, then tap the filter icon and select "Least used".',
      'Select the apps you no longer need.',
      'Tap the trash can icon at the top to batch-uninstall or archive.',
    ],
    systemSettingPath: 'Play Store → Manage apps & device → Manage → Least used',
  },
  {
    id: 'tip_streaming_offline',
    title: 'Purge Offline Video & Music Downloads',
    tagline: 'Offline movies and playlist syncs from streaming services remain stored indefinitely.',
    description:
      'Apps like YouTube, Netflix, Spotify, and Amazon Prime Video cache downloaded media at maximum bitrates. Deleting watched episodes immediately reclaims huge storage chunks.',
    category: 'Media',
    potentialSavings: '2.5 – 8.0 GB',
    difficulty: 'Easy (2 mins)',
    steps: [
      'Open Netflix or Prime Video → Go to Downloads tab.',
      'Delete watched seasons or individual movie downloads.',
      'In YouTube: Library / You tab → Downloads → Tap (⋮) → Remove from downloads.',
      'In Spotify: Library → Downloaded filter → Tap (⋮) → Remove download on old playlists.',
    ],
    systemSettingPath: 'Streaming Apps → Downloads tab → Delete watched downloads',
  },
  {
    id: 'tip_empty_system_trash',
    title: 'Empty the Photos & Files Trash Bin',
    tagline: 'Deleted photos and downloads stay in the Trash bin for 30 to 60 days before being purged.',
    description:
      'When you delete a photo or file on Android, the operating system moves it to the hidden .trashed folder to give you an undo window. Purging the trash reclaims that space immediately.',
    category: 'System',
    potentialSavings: '1.0 – 6.0 GB',
    difficulty: 'Quick (1 min)',
    steps: [
      'Open the Google Files or Samsung My Files app.',
      'Tap the navigation menu (≡) → Trash / Recycle Bin.',
      'Review any files you might need to restore.',
      'Tap "All items" → "Delete" to permanently reclaim the bytes right now.',
    ],
    systemSettingPath: 'Files app → Menu (≡) → Trash → Empty Trash',
  },
  {
    id: 'tip_offline_maps',
    title: 'Review Offline Maps & Regional Navigation Packs',
    tagline: 'Detailed topographic and road maps for entire states or countries can weigh several GBs.',
    description:
      'Offline maps saved for vacations or road trips continue to occupy storage long after you return. Reviewing downloaded regions frees up storage without affecting online GPS navigation.',
    category: 'Media',
    potentialSavings: '500 MB – 2.0 GB',
    difficulty: 'Quick (1 min)',
    steps: [
      'Open Google Maps on your phone.',
      'Tap your profile picture → Offline maps.',
      'Tap the three dots (⋮) next to expired travel maps you no longer need.',
      'Tap "Delete" and confirm.',
    ],
    systemSettingPath: 'Google Maps → Profile → Offline maps → Delete old areas',
  },
];

const COMPLETED_TIPS_KEY = 'cleanpulse_completed_tips_v1';

/**
 * Returns today's deterministic tip based on current calendar date
 */
export function getTodaysStorageTip(): { tip: StorageTip; tipIndex: number } {
  const now = new Date();
  // Generate stable daily index using Year + Day of year
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const tipIndex = dayOfYear % STORAGE_TIPS.length;

  return {
    tip: STORAGE_TIPS[tipIndex],
    tipIndex,
  };
}

/**
 * Retrieves whether a specific tip was marked done today
 */
export function isTipCompletedToday(tipId: string): boolean {
  try {
    const raw = localStorage.getItem(COMPLETED_TIPS_KEY);
    if (!raw) return false;
    const records: Record<string, string> = JSON.parse(raw);
    const todayStr = new Date().toISOString().slice(0, 10);
    return records[tipId] === todayStr;
  } catch {
    return false;
  }
}

/**
 * Toggles a tip as completed for today
 */
export function toggleTipCompletedToday(tipId: string): boolean {
  try {
    const raw = localStorage.getItem(COMPLETED_TIPS_KEY);
    const records: Record<string, string> = raw ? JSON.parse(raw) : {};
    const todayStr = new Date().toISOString().slice(0, 10);

    const isCurrentlyDone = records[tipId] === todayStr;
    if (isCurrentlyDone) {
      delete records[tipId];
      localStorage.setItem(COMPLETED_TIPS_KEY, JSON.stringify(records));
      return false;
    } else {
      records[tipId] = todayStr;
      localStorage.setItem(COMPLETED_TIPS_KEY, JSON.stringify(records));
      return true;
    }
  } catch {
    return false;
  }
}
