# Modern Android OS Restrictions & Legitimate Engineering Solutions

Many legacy cleaner apps advertise deceptive capabilities: "One-Click Clear All App Caches", "RAM Boost 100%", "Cool Down CPU". CleanPulse is built on **honest, production-grade Android OS engineering**.

### 1. Clearing Other Applications' Caches
- **Platform Restriction**: Since Android 8.0 (Oreo) and reinforced heavily in Android 11+ with Scoped Storage and SELinux policies, Android forbids non-system apps from clearing `/data/data/<package>/cache` of third-party apps.
- **Deceptive Apps' Trick**: Fake cleaners ask for Accessibility Services to rapidly click "Clear Cache" in Android settings while flashing a fake progress bar. Google Play actively bans this practice.
- **CleanPulse's Solution**:
  1. Accurately flags app-owned cache as guaranteed reclaimable.
  2. For external heavy apps, CleanPulse calculates storage footprints via `StorageStatsManager` (when authorized) and provides direct deep links to the OS Settings page (`Settings.ACTION_APPLICATION_DETAILS_SETTINGS`) with clear user instructions.

### 2. "RAM Booster" Myths vs Modern Linux Virtual Memory
- **Operating System Reality**: Android's Linux kernel manages RAM through Low Memory Killer (LMK). Unused RAM is wasted RAM; cached background processes speed up cold starts. Force-closing processes causes them to immediately respawn, consuming **more** CPU cycles and battery.
- **CleanPulse's Principle**: CleanPulse strictly avoids process killing. The app includes an educational Device Health dashboard explaining the distinction between storage space and memory.

### 3. WorkManager Inexact Execution
- **Platform Reality**: Android WorkManager is not an exact timer. Periodic work requests are queued to batch with other system tasks during maintenance windows to preserve battery life. Under Android Doze mode and manufacturer battery savers (e.g. Samsung OneUI, Xiaomi MIUI), execution windows may float by 15–45 minutes.
- **CleanPulse's Solution**: CleanPulse describes the schedule as approximate ("within 7 days") and only runs when the battery isn't low and the device is idle, if you keep those options on.
