package com.cleanpulse.app.ui.screens

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
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
import androidx.compose.material.icons.automirrored.outlined.OpenInNew
import androidx.compose.material.icons.outlined.BatteryChargingFull
import androidx.compose.material.icons.outlined.BatteryStd
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Storage
import androidx.compose.material3.Button
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.data.health.AppStorage
import com.cleanpulse.app.ui.StorageUiState
import com.cleanpulse.app.ui.components.SectionCard
import com.cleanpulse.app.ui.components.formatBytes
import com.cleanpulse.app.ui.theme.Amber
import com.cleanpulse.app.ui.theme.Cyan
import com.cleanpulse.app.ui.theme.Emerald
import com.cleanpulse.app.ui.theme.Rose
import com.cleanpulse.app.ui.theme.Slate500

@Composable
fun DeviceHealthScreen(state: StorageUiState, onLoad: () -> Unit) {
    val context = LocalContext.current
    val health = state.health
    LaunchedEffect(health.hasUsageAccess) { onLoad() }

    val used = state.device.usedFraction
    val (pressure, pressureColor) = when {
        used >= 0.9f -> "CRITICAL" to Rose
        used >= 0.75f -> "MODERATE" to Amber
        else -> "NORMAL" to Emerald
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Device health", fontWeight = FontWeight.SemiBold, fontSize = 17.sp)
                        Text("Storage, battery and the apps using space", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    HealthTile(Modifier.weight(1f), "Storage pressure", Icons.Outlined.Storage, pressure, pressureColor,
                        "${(used * 100).toInt()}% of ${formatBytes(state.device.totalBytes)} used")
                    val battery = health.battery
                    HealthTile(
                        Modifier.weight(1f), "Battery",
                        if (battery?.charging == true) Icons.Outlined.BatteryChargingFull else Icons.Outlined.BatteryStd,
                        if (battery == null || battery.level < 0) "–" else "${battery.level}%",
                        Cyan,
                        if (battery == null) "" else "${if (battery.charging) "Charging" else "On battery"} · ${battery.health} · ${battery.temperatureC}°C"
                    )
                }
            }
            item {
                SectionCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Info, contentDescription = null, tint = Cyan)
                        Spacer(Modifier.width(10.dp))
                        Text("RAM: facts vs myths", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "CleanPulse frees disk storage only. It has no \"RAM booster\" or task killer, on purpose.",
                        fontSize = 13.sp
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Android keeps recently used apps cached in memory so they reopen instantly. Force-stopping them " +
                            "makes them cold-start later, which costs more CPU time and more battery, not less.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            item {
                Text("Apps using the most space", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(
                    "Android doesn't let one app clear another app's cache. Tap an app to open its storage settings.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            when {
                !health.hasUsageAccess -> item {
                    SectionCard {
                        Text("Usage access needed", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        Text(
                            "To read how much space each app uses, turn on Usage access for CleanPulse. " +
                                "It's only used to read app sizes on this phone.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(10.dp))
                        Button(onClick = { openUsageAccess(context) }) { Text("Allow usage access") }
                    }
                }
                health.loadingApps && health.apps.isEmpty() -> item {
                    Row(Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.Center) {
                        CircularProgressIndicator()
                    }
                }
                else -> {
                    val max = health.apps.maxOfOrNull { it.totalBytes }?.coerceAtLeast(1L) ?: 1L
                    items(health.apps, key = { it.packageName }) { app -> AppRow(app, max) { openAppSettings(context, app.packageName) } }
                }
            }
        }
    }
}

@Composable
private fun HealthTile(
    modifier: Modifier,
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    value: String,
    color: Color,
    caption: String
) {
    Surface(modifier = modifier, shape = RoundedCornerShape(18.dp), color = MaterialTheme.colorScheme.surfaceContainer) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text(label, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = color, modifier = Modifier.padding(vertical = 4.dp))
            Text(caption, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun AppRow(app: AppStorage, max: Long, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceContainer,
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).clickable(onClick = onClick)
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(app.label, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(
                        "App ${formatBytes(app.appBytes)} · Data ${formatBytes(app.dataBytes)} · Cache ${formatBytes(app.cacheBytes)}",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Text(formatBytes(app.totalBytes), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Spacer(Modifier.width(6.dp))
                Icon(Icons.AutoMirrored.Outlined.OpenInNew, contentDescription = "Manage", tint = Slate500, modifier = Modifier.size(16.dp))
            }
            Spacer(Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = { app.totalBytes.toFloat() / max },
                modifier = Modifier.fillMaxWidth().height(4.dp).clip(RoundedCornerShape(2.dp)),
                color = Emerald,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
        }
    }
}

private fun openAppSettings(context: Context, packageName: String) {
    context.startActivity(
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", packageName, null))
    )
}

private fun openUsageAccess(context: Context) {
    val direct = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, Uri.fromParts("package", context.packageName, null))
    try {
        context.startActivity(direct)
    } catch (_: ActivityNotFoundException) {
        context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
    }
}
