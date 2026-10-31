package com.cleanpulse.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.DriveFolderUpload
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.data.local.AutoCleanSettings
import com.cleanpulse.app.data.local.CleanupHistoryEntity
import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.repository.StorageTip
import com.cleanpulse.app.ui.StorageUiState
import com.cleanpulse.app.ui.components.AppIcon
import com.cleanpulse.app.ui.components.CategoryBadge
import com.cleanpulse.app.ui.components.Pill
import com.cleanpulse.app.ui.components.SectionCard
import com.cleanpulse.app.ui.components.UsageRing
import com.cleanpulse.app.ui.components.formatBytes
import com.cleanpulse.app.ui.components.formatRelative
import com.cleanpulse.app.ui.components.style
import com.cleanpulse.app.ui.isDeletable
import com.cleanpulse.app.ui.theme.Amber
import com.cleanpulse.app.ui.theme.Cyan
import com.cleanpulse.app.ui.theme.Emerald
import com.cleanpulse.app.ui.theme.Slate500
import java.util.concurrent.TimeUnit

val DASHBOARD_CATEGORIES = listOf(
    FileCategory.DUPLICATES,
    FileCategory.TEMP_FILES,
    FileCategory.APP_APKS,
    FileCategory.OLD_DOWNLOADS,
    FileCategory.EMPTY_DIRS,
    FileCategory.LARGE_FILES,
    FileCategory.APP_CACHE
)

@Composable
fun DashboardScreen(
    state: StorageUiState,
    settings: AutoCleanSettings,
    history: List<CleanupHistoryEntity>,
    tips: List<StorageTip>,
    tipIndex: Int,
    onScan: () -> Unit,
    onScanFolder: () -> Unit,
    onQuickClean: () -> Unit,
    onCleanSelected: () -> Unit,
    onOpenCategory: (FileCategory?) -> Unit,
    onOpenSettings: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenGuide: () -> Unit,
    onArchive: (Set<String>) -> Unit,
    onDeleteSuggested: (Set<String>) -> Unit,
    onDismissArchive: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        AppIcon(34.dp)
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text("CleanPulse", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Text("smart. fresh. lived.", fontSize = 11.sp, color = Slate500)
                        }
                    }
                },
                actions = {
                    Row(Modifier.padding(end = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.VerifiedUser, contentDescription = null, tint = Emerald, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Offline", fontSize = 12.sp, color = Emerald)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item { StorageCard(state, onScan, onQuickClean, onCleanSelected, onOpenGuide) }
            item {
                SmartSuggestCard(
                    summary = state.smartSuggest,
                    isBusy = state.isArchiving || state.isCleaning,
                    lastArchive = state.lastArchive,
                    onArchive = onArchive,
                    onDelete = onDeleteSuggested,
                    onDismissArchive = onDismissArchive
                )
            }
            item { ReclaimedStorageChart(history, onOpenHistory) }
            item { StorageTipsCard(tips, tipIndex) }
            item {
                Row(Modifier.fillMaxWidth().padding(top = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("Cleanup categories", fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.weight(1f))
                    TextButton(onClick = { onOpenCategory(null) }, enabled = state.hasResults) {
                        Text("Review all (${state.candidates.count { it.isDeletable }})")
                    }
                }
            }
            items(DASHBOARD_CATEGORIES, key = { it.name }) { category ->
                val items = state.inCategory(category).filter { it.isDeletable }
                CategoryListRow(category, items.size, items.sumOf { it.size }, state.hasResults) { onOpenCategory(category) }
            }
            item {
                ActionRow(
                    icon = { Icon(Icons.Outlined.DriveFolderUpload, contentDescription = null, tint = Cyan) },
                    title = "Scan a custom folder",
                    subtitle = "Pick one folder to check instead of all storage",
                    onClick = onScanFolder
                )
            }
            item { ScheduleStrip(settings, onOpenSettings) }
        }
    }
}

@Composable
private fun StorageCard(
    state: StorageUiState,
    onScan: () -> Unit,
    onQuickClean: () -> Unit,
    onCleanSelected: () -> Unit,
    onOpenGuide: () -> Unit
) {
    val device = state.device
    val quickBytes = state.quickCleanCandidates.sumOf { it.size }
    SectionCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            UsageRing(device.usedFraction, Modifier.size(132.dp)) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("${(device.usedFraction * 100).toInt()}%", fontSize = 28.sp, fontWeight = FontWeight.Bold)
                    Text("used", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Spacer(Modifier.width(18.dp))
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Metric("Used", formatBytes(device.usedBytes))
                Metric("Free", formatBytes(device.freeBytes))
                Metric("Total", formatBytes(device.totalBytes))
            }
        }
        Spacer(Modifier.height(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricTile(
                Modifier.weight(1f), "Guaranteed safe",
                if (state.hasResults) formatBytes(state.safeBytes) else "–", "Cache, temp files, extra copies", Emerald
            )
            MetricTile(
                Modifier.weight(1f), "Worth reviewing",
                if (state.hasResults) formatBytes(state.reviewBytes) else "–", "Old downloads, large files", Amber
            )
        }
        if (state.hasResults) {
            Text(
                "Last scan ${formatRelative(state.lastScanAt!!)}" +
                    (state.scannedFolder?.let { " · ${it.removePrefix("/storage/emulated/0")}" } ?: ""),
                fontSize = 11.sp,
                color = Slate500,
                modifier = Modifier.padding(top = 8.dp)
            )
        }
        Spacer(Modifier.height(12.dp))

        if (quickBytes > 0 && !state.isCleaning) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Emerald.copy(alpha = 0.12f),
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).clickable(onClick = onQuickClean)
            ) {
                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Bolt, contentDescription = null, tint = Emerald)
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Quick Clean", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        Text("App cache & temporary files", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text("+${formatBytes(quickBytes)}", fontWeight = FontWeight.Bold, color = Emerald)
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Emerald)
                }
            }
            Spacer(Modifier.height(10.dp))
        }

        when {
            state.isCleaning -> Row(Modifier.fillMaxWidth().height(52.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                Spacer(Modifier.width(10.dp))
                Text("Cleaning…")
            }
            state.selectedBytes > 0 -> {
                Button(onClick = onCleanSelected, modifier = Modifier.fillMaxWidth().height(52.dp)) {
                    Icon(Icons.Outlined.Delete, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Clean selected (${formatBytes(state.selectedBytes)})", fontWeight = FontWeight.SemiBold)
                }
                Spacer(Modifier.height(8.dp))
                FilledTonalButton(onClick = onScan, modifier = Modifier.fillMaxWidth().height(48.dp)) { Text("Rescan storage") }
            }
            else -> Button(onClick = onScan, modifier = Modifier.fillMaxWidth().height(52.dp)) {
                Icon(Icons.Outlined.AutoAwesome, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(if (state.hasResults) "Rescan storage" else "Scan device storage", fontWeight = FontWeight.SemiBold)
            }
        }
        Row(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).clickable(onClick = onOpenGuide).padding(vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(Icons.Outlined.Info, contentDescription = null, tint = Cyan, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
            Text("Which files are ready to clean and why?", fontSize = 12.sp, color = Cyan)
        }
    }
}

@Composable
private fun Metric(label: String, value: String) {
    Column {
        Text(label, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun MetricTile(modifier: Modifier, label: String, value: String, caption: String, color: androidx.compose.ui.graphics.Color) {
    Surface(modifier = modifier, shape = RoundedCornerShape(14.dp), color = color.copy(alpha = 0.08f)) {
        Column(Modifier.padding(12.dp)) {
            Text(label, fontSize = 11.sp, color = color, fontWeight = FontWeight.Medium)
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(caption, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun CategoryListRow(category: FileCategory, count: Int, bytes: Long, scanned: Boolean, onClick: () -> Unit) {
    val style = category.style()
    Surface(
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceContainer,
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).clickable(onClick = onClick)
    ) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            CategoryBadge(category)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(style.label, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                Text(style.summary, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    when {
                        !scanned -> "–"
                        bytes > 0 -> formatBytes(bytes)
                        else -> "$count items"
                    },
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp
                )
                if (scanned) Text("$count ${if (count == 1) "file" else "files"}", fontSize = 11.sp, color = Slate500)
            }
            Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Slate500)
        }
    }
}

@Composable
private fun ActionRow(icon: @Composable () -> Unit, title: String, subtitle: String, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceContainer,
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).clickable(onClick = onClick)
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            icon()
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                Text(subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Slate500)
        }
    }
}

@Composable
private fun ScheduleStrip(settings: AutoCleanSettings, onOpenSettings: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .clickable(onClick = onOpenSettings)
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Outlined.CalendarMonth, contentDescription = null, tint = Slate500, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(8.dp))
        Text("Next auto cleanup: ", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        if (settings.enabled) Pill(nextRunLabel(settings.frequency), Emerald) else Pill("Off", Slate500)
        Spacer(Modifier.weight(1f))
        Text("Configure", fontSize = 12.sp, color = Emerald)
    }
}

private fun nextRunLabel(frequency: String): String {
    val days = when (frequency) {
        "daily" -> 1L
        "three_days" -> 3L
        "monthly" -> 30L
        else -> 7L
    }
    return if (days == 1L) "within a day" else "within ${TimeUnit.DAYS.toDays(days)} days"
}

fun frequencyLabel(frequency: String): String = when (frequency) {
    "daily" -> "Daily"
    "three_days" -> "Every 3 days"
    "weekly" -> "Weekly"
    "monthly" -> "Monthly"
    else -> "Weekly"
}
