package com.cleanpulse.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoMode
import androidx.compose.material.icons.outlined.CleaningServices
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.data.local.CleanupHistoryEntity
import com.cleanpulse.app.data.local.ScanHistoryEntity
import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.ui.components.BackTopBar
import com.cleanpulse.app.ui.components.SectionCard
import com.cleanpulse.app.ui.components.StatRow
import com.cleanpulse.app.ui.components.formatBytes
import com.cleanpulse.app.ui.components.formatDateTime
import com.cleanpulse.app.ui.components.style
import com.cleanpulse.app.ui.theme.Cyan
import com.cleanpulse.app.ui.theme.Emerald

private sealed interface HistoryEntry {
    val timestamp: Long

    data class Cleanup(val entity: CleanupHistoryEntity) : HistoryEntry {
        override val timestamp get() = entity.timestamp
    }

    data class Scan(val entity: ScanHistoryEntity) : HistoryEntry {
        override val timestamp get() = entity.timestamp
    }
}

@Composable
fun HistoryScreen(
    cleanups: List<CleanupHistoryEntity>,
    scans: List<ScanHistoryEntity>,
    onBack: () -> Unit,
    onClear: () -> Unit
) {
    val entries = (cleanups.map { HistoryEntry.Cleanup(it) } + scans.map { HistoryEntry.Scan(it) })
        .sortedByDescending { it.timestamp }

    Scaffold(
        topBar = {
            BackTopBar("History", onBack = onBack) {
                if (entries.isNotEmpty()) TextButton(onClick = onClear) { Text("Clear") }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            item {
                SectionCard {
                    StatRow("Total freed", formatBytes(cleanups.sumOf { it.bytesReclaimed }), Emerald)
                    StatRow("Cleanups", cleanups.size.toString())
                    StatRow("Scans", scans.size.toString())
                }
            }
            if (entries.isEmpty()) {
                item {
                    Text(
                        "Nothing here yet. Your scans and cleanups will show up here.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }
            items(entries, key = { "${it::class.simpleName}-${it.timestamp}" }) { entry ->
                when (entry) {
                    is HistoryEntry.Cleanup -> EntryCard(
                        icon = if (entry.entity.triggeredBy == "MANUAL") Icons.Outlined.CleaningServices else Icons.Outlined.AutoMode,
                        tint = Emerald,
                        title = "Freed ${formatBytes(entry.entity.bytesReclaimed)}",
                        detail = "${entry.entity.itemsCount} items · " + entry.entity.categoriesCleaned
                            .mapNotNull { name -> FileCategory.entries.find { it.name == name }?.style()?.label }
                            .joinToString(", "),
                        caption = (if (entry.entity.triggeredBy == "MANUAL") "Manual" else "Scheduled") +
                            " · " + formatDateTime(entry.timestamp)
                    )
                    is HistoryEntry.Scan -> EntryCard(
                        icon = Icons.Outlined.Search,
                        tint = Cyan,
                        title = "Scanned %,d files".format(entry.entity.filesScanned),
                        detail = "${formatBytes(entry.entity.cleanableFoundBytes)} found · " +
                            "${entry.entity.duplicatesFoundCount} duplicates · ${entry.entity.durationMs / 1000}s",
                        caption = formatDateTime(entry.timestamp)
                    )
                }
            }
        }
    }
}

@Composable
private fun EntryCard(icon: ImageVector, tint: androidx.compose.ui.graphics.Color, title: String, detail: String, caption: String) {
    SectionCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = tint)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.fillMaxWidth()) {
                Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                Text(detail, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(caption, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
