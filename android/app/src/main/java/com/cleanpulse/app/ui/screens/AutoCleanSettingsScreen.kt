package com.cleanpulse.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.Icon
import androidx.compose.material3.Slider
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import com.cleanpulse.app.ui.theme.Emerald
import com.cleanpulse.app.ui.theme.Slate500
import kotlin.math.roundToInt
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.data.local.AutoCleanSettings
import com.cleanpulse.app.ui.components.SectionCard

@Composable
fun AutoCleanSettingsScreen(
    settings: AutoCleanSettings,
    onUpdate: ((AutoCleanSettings) -> AutoCleanSettings) -> Unit,
    onOpenHistory: () -> Unit,
    onOpenPrivacy: () -> Unit
) {
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Settings", fontWeight = FontWeight.SemiBold, fontSize = 17.sp)
                        Text("Scheduled cleanup and scan rules", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                SectionCard {
                    ToggleRow(
                        "Clean automatically",
                        "Runs in the background and removes only the categories below. " +
                            "Downloads, duplicates and large files always need your review.",
                        settings.enabled
                    ) { on -> onUpdate { it.copy(enabled = on) } }
                }
            }
            item {
                SectionCard {
                    Text("How often", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    FlowRow(
                        Modifier.fillMaxWidth().padding(top = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("daily", "three_days", "weekly", "monthly").forEach { freq ->
                            FilterChip(
                                selected = settings.frequency == freq,
                                onClick = { onUpdate { it.copy(frequency = freq) } },
                                label = { Text(frequencyLabel(freq), fontSize = 12.sp) }
                            )
                        }
                    }
                }
            }
            item {
                SectionCard {
                    Text("What to remove", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    val c = settings.categories
                    ToggleRow("App cache", "CleanPulse's own temporary data", c.appCache) { on ->
                        onUpdate { it.copy(categories = it.categories.copy(appCache = on)) }
                    }
                    ToggleRow("Temporary files", ".tmp, partial downloads, gallery trash", c.tempFiles) { on ->
                        onUpdate { it.copy(categories = it.categories.copy(tempFiles = on, tmpFiles = on)) }
                    }
                    ToggleRow("Empty folders", "Folders with nothing in them", c.emptyDirs) { on ->
                        onUpdate { it.copy(categories = it.categories.copy(emptyDirs = on)) }
                    }
                    ToggleRow("APK installers", "Every .apk file on shared storage", c.apks) { on ->
                        onUpdate { it.copy(categories = it.categories.copy(apks = on)) }
                    }
                }
            }
            item {
                SectionCard {
                    Text("Only run when", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    ToggleRow("Battery isn't low", null, settings.requireBatteryNotLow) { on ->
                        onUpdate { it.copy(requireBatteryNotLow = on) }
                    }
                    ToggleRow("Phone is idle", null, settings.requireDeviceIdle) { on ->
                        onUpdate { it.copy(requireDeviceIdle = on) }
                    }
                }
            }
            item {
                SectionCard {
                    Text("Scan rules", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    SliderRow(
                        "Run scheduled cleanup when storage is over",
                        settings.storageThresholdPercent, 50..95, step = 5, suffix = "% full",
                        enabled = true
                    ) { v -> onUpdate { it.copy(storageThresholdPercent = v) } }
                    SliderRow(
                        "Flag downloads older than",
                        settings.maxFileAgeDays, 30..365, step = 15, suffix = " days"
                    ) { v -> onUpdate { it.copy(maxFileAgeDays = v) } }
                    SliderRow(
                        "Flag files larger than",
                        settings.largeFileThresholdMb, 10..500, step = 10, suffix = " MB"
                    ) { v -> onUpdate { it.copy(largeFileThresholdMb = v) } }
                }
            }
            item {
                SectionCard {
                    LinkRow(Icons.Outlined.History, "Cleanup history", "Past scans and freed space", onOpenHistory)
                    LinkRow(Icons.Outlined.Shield, "Privacy & permissions", "Permissions, app cache, onboarding", onOpenPrivacy)
                }
            }
        }
    }
}

@Composable
private fun ToggleRow(title: String, subtitle: String?, checked: Boolean, enabled: Boolean = true, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f).padding(end = 12.dp)) {
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            if (subtitle != null) {
                Text(subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Switch(checked = checked, onCheckedChange = onChange, enabled = enabled)
    }
}

@Composable
private fun SliderRow(
    title: String,
    value: Int,
    range: IntRange,
    step: Int,
    suffix: String,
    enabled: Boolean = true,
    onCommit: (Int) -> Unit
) {
    var local by remember(value) { mutableFloatStateOf(value.toFloat()) }
    Column(Modifier.fillMaxWidth().padding(top = 10.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(title, fontSize = 13.sp, modifier = Modifier.weight(1f))
            Text("${local.roundToInt()}$suffix", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Emerald)
        }
        Slider(
            value = local,
            onValueChange = { local = it },
            onValueChangeFinished = { onCommit(local.roundToInt()) },
            valueRange = range.first.toFloat()..range.last.toFloat(),
            steps = (range.last - range.first) / step - 1,
            enabled = enabled
        )
    }
}

@Composable
private fun LinkRow(icon: ImageVector, title: String, subtitle: String, onClick: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp, horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = Emerald)
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Text(subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Slate500)
    }
}
