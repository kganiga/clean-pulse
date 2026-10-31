package com.cleanpulse.app.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.ui.StorageUiState
import com.cleanpulse.app.ui.components.BackTopBar
import com.cleanpulse.app.ui.components.Pill
import com.cleanpulse.app.ui.components.SectionCard
import com.cleanpulse.app.ui.components.formatBytes
import com.cleanpulse.app.ui.theme.Amber
import com.cleanpulse.app.ui.theme.Emerald

@Composable
fun PrivacySettingsScreen(
    state: StorageUiState,
    onBack: () -> Unit,
    onClearAppCache: ((Long) -> Unit) -> Unit,
    onReplayOnboarding: () -> Unit
) {
    val context = LocalContext.current
    var clearedMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(topBar = { BackTopBar("Privacy & permissions", "What CleanPulse can and can't do", onBack) }) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                SectionCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Shield, contentDescription = null, tint = Emerald)
                        Spacer(Modifier.width(10.dp))
                        Text("Privacy promise", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    }
                    Spacer(Modifier.height(8.dp))
                    Point("No telemetry", "No analytics, tracking SDKs or network calls. The app has no internet permission.")
                    Point("No account", "Works fully offline, without sign-in or cloud sync.")
                    Point("Local hashing", "SHA-256 checks run on your phone and the hashes are thrown away after the scan.")
                    Point("You decide", "Nothing is deleted without your confirmation, except categories you switch on for scheduled cleanup.")
                }
            }
            item {
                SectionCard {
                    Text("Permissions", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    Spacer(Modifier.height(6.dp))
                    PermissionRow(
                        "All files access",
                        "Needed to find installers, partial downloads and duplicates.",
                        state.hasAccess
                    ) { openAppSettings(context) }
                    PermissionRow(
                        "Usage access",
                        "Optional. Shows which apps use the most space on the Health tab.",
                        state.health.hasUsageAccess
                    ) { context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) }
                }
            }
            item {
                SectionCard {
                    Text("CleanPulse's own cache", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    Text(
                        "Temporary files this app created. Clearing them keeps your settings and history.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(10.dp))
                    FilledTonalButton(onClick = {
                        onClearAppCache { freed -> clearedMessage = "Cleared ${formatBytes(freed)} of app cache." }
                    }) {
                        Icon(Icons.Outlined.Delete, contentDescription = null, modifier = Modifier.size(18.dp))
                        Text("  Clear app cache")
                    }
                    clearedMessage?.let { Text(it, fontSize = 12.sp, color = Emerald, modifier = Modifier.padding(top = 6.dp)) }
                }
            }
            item {
                SectionCard {
                    Text("Onboarding", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    Text(
                        "Show the welcome screens and permission explanation again.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(10.dp))
                    OutlinedButton(onClick = onReplayOnboarding) {
                        Icon(Icons.Outlined.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                        Text("  Replay onboarding")
                    }
                }
            }
        }
    }
}

@Composable
private fun Point(title: String, body: String) {
    Column(Modifier.padding(vertical = 4.dp)) {
        Text(title, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        Text(body, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun PermissionRow(title: String, body: String, granted: Boolean, onManage: () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(title, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                Spacer(Modifier.width(8.dp))
                if (granted) Pill("On", Emerald) else Pill("Off", Amber)
            }
            Text(body, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        TextButton(onClick = onManage) { Text("Manage") }
    }
}

private fun openAppSettings(context: Context) {
    context.startActivity(
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", context.packageName, null))
    )
}
