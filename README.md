<div align="center">
  <img src="public/icon-512.png" width="112" alt="CleanPulse icon" />
  <h1>CleanPulse</h1>
  <p><em>smart. fresh. lived.</em></p>
  <p>An honest, offline storage cleaner for Android, built with Jetpack Compose.</p>
  <p><a href="release/CleanPulse-1.0.1.apk"><strong>Download the APK (v1.0.1)</strong></a></p>
</div>

---

CleanPulse finds the files that quietly eat your phone's storage, explains why each one was flagged, and deletes only what you approve. It has no ads, no accounts, no analytics and no internet permission. No fake "RAM booster" either.

## Features

| | |
| :--- | :--- |
| **Storage scan** | Walks shared storage and sorts what it finds into cache, temporary files, APK installers, empty folders, exact duplicates, old downloads and large files. |
| **Exact duplicates** | Groups by size, then by the first 64 KB, then by a streamed SHA-256 of the whole file. One copy is always kept, with the camera roll preferred as the original. |
| **Quick Clean** | One tap clears cache and temporary files. |
| **Review & clean** | Every category can be opened, filtered and selected file by file. Nothing is deleted without a confirmation. Files that changed since the scan are skipped. |
| **Smart Suggest** | Spots files untouched for 90+ days and suggests archiving (documents, videos) or deleting (installers, stale temp files). Archive zips them into `Documents/CleanPulse Archives` and removes the originals only after the zip is written. |
| **Custom folder scan** | Pick any folder with the system picker and scan just that. |
| **Scheduled cleanup** | Optional and off by default. A WorkManager job removes only the categories you choose, only when storage is over your threshold, and (by default) only when the battery isn't low and the phone is idle. |
| **History & trends** | Every scan and cleanup is logged in Room, with a 7, 14 and 30-day reclaimed-storage chart. |
| **Device health** | Storage pressure, battery state, and which apps use the most space (with Usage access), each linking to its system storage page. |
| **Storage tips** | Seven practical tips for space Android doesn't let apps clear directly (browser cache, chat media, offline maps and more). |

Scan results are saved, so they survive the app being closed or updated.

## Download and install

1. Download [`release/CleanPulse-1.0.1.apk`](release/CleanPulse-1.0.1.apk) on your phone.
2. Open it and allow installing from that source when Android asks.
3. On first launch, turn on **All files access** for CleanPulse.

Requires Android 8.0 (API 26) or newer.

## Permissions

| Permission | Why |
| :--- | :--- |
| `MANAGE_EXTERNAL_STORAGE` (All files access) | On Android 11+ it's the only way to see non-media files such as APKs, partial downloads and documents. Requested on first launch from system settings. |
| `READ/WRITE_EXTERNAL_STORAGE` | The same access on Android 8–10. |
| `PACKAGE_USAGE_STATS` (Usage access) | Optional. Only used on the Health tab to read per-app storage sizes. |
| `POST_NOTIFICATIONS` | Optional. Tells you how much a scheduled cleanup freed. |

CleanPulse can't clear other apps' private caches, because Android doesn't allow it. Instead it shows which apps are largest and opens their storage settings. See [android/docs](android/docs) for the platform details.

> **Play Store note:** apps that request All files access need an approved policy declaration on Google Play. This build is meant for direct install.

## Project layout

```
android/                Native app (Kotlin, Jetpack Compose, Material 3)
  app/src/main/java/com/cleanpulse/app/
    data/scanner/       FileScanner, Sha256Hasher
    data/cleanup/       SafeCleanupEngine, ArchiveEngine
    data/local/         Room history, DataStore settings, saved scan results
    data/health/        Battery and per-app storage stats
    domain/             SmartSuggestEngine
    ui/                 StorageViewModel, screens, theme
    work/               AutoCleanWorker, CleanPulseWorkScheduler
  docs/                 Android limitations and permission notes
release/                Signed release APK
src/, public/           Original React/Vite web prototype (AI Studio)
```

## Building

Requirements: JDK 17+, Android SDK 36. The Gradle wrapper (Gradle 9.6, AGP 9.4, Kotlin 2.2) is included.

```bash
cd android
./gradlew testDebugUnitTest   # unit tests
./gradlew assembleDebug       # debug APK  -> app/build/outputs/apk/debug/
./gradlew installDebug        # install on a connected device or emulator
```

### Release builds

Release signing reads `android/keystore.properties`, which is git-ignored, as is the keystore:

```properties
storeFile=keystore/cleanpulse-release.jks
storePassword=...
keyAlias=cleanpulse
keyPassword=...
```

```bash
./gradlew assembleRelease     # -> app/build/outputs/apk/release/app-release.apk
```

Keep the keystore and its passwords backed up. Updates must be signed with the same key.

### Windows: folder names with non-ASCII characters

If the project path contains characters like an em dash, AGP refuses to build and unit tests fail to load. `android.overridePathCheck=true` is set in `gradle.properties`. To run tests, build from an ASCII path, for example through a junction:

```bat
mklink /J %TEMP%\cleanpulse-android "<path to>\android"
cd %TEMP%\cleanpulse-android && gradlew testDebugUnitTest
```

## Web prototype

The original interactive prototype lives in `src/` (React, Vite, Tailwind). Run it with `npm install` and then `npm run dev`. It simulates storage and is not needed for the Android app.
