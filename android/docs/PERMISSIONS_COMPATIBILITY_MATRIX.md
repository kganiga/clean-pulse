# Android Permissions & API Compatibility Matrix

CleanPulse asks only for what a whole-storage cleaner needs, and explains each request in the app. It never uses Accessibility Services, root or `QUERY_ALL_PACKAGES`.

| Feature | Android 8.0 - 10 (API 26-29) | Android 11+ (API 30+) | Implementation |
| :--- | :--- | :--- | :--- |
| **Shared storage scan** | `READ/WRITE_EXTERNAL_STORAGE` (runtime) | `MANAGE_EXTERNAL_STORAGE` ("All files access", granted in system settings) | `File.walkTopDown()` over `/storage/emulated/0`, skipping `Android/` and `.thumbnails`. MediaStore alone can't see APKs, partial downloads or documents on Android 11+. |
| **Deleting files** | Same as above | Same as above | `File.delete()` with a guard that skips files whose size or modified time changed since the scan. MediaStore is re-scanned afterwards. |
| **Custom folder scan** | System folder picker | System folder picker (`ACTION_OPEN_DOCUMENT_TREE`) | The picked tree is converted to a path and scanned with the same engine. |
| **App-owned cache** | `getCacheDir()` / `getExternalCacheDir()` | Same | Always safe to clear. |
| **Other apps' cache** | Not allowed | Not allowed (app sandbox) | Health tab lists the largest apps and opens `ACTION_APPLICATION_DETAILS_SETTINGS`. |
| **Per-app storage sizes** | `PACKAGE_USAGE_STATS` (Usage access) | Same | `StorageStatsManager.queryStatsForPackage`, optional, Health tab only. Launcher apps are listed through a `<queries>` intent filter. |
| **Background cleanup** | WorkManager | WorkManager | Periodic work with battery-not-low and idle constraints. Off by default, and runs only above the storage threshold. |
| **Duplicate hashing** | Streamed SHA-256 (64 KB buffer) | Same | Size -> first 64 KB -> full hash, so large videos never load into memory. |
| **Notifications** | Notification channel | `POST_NOTIFICATIONS` on Android 13+ | Requested when scheduled cleanup is turned on. |
