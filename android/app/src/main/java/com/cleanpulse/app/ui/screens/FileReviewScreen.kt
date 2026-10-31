package com.cleanpulse.app.ui.screens

import android.content.ActivityNotFoundException
import android.content.Intent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.OpenInNew
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.material3.Button
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.FilterChip
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import com.cleanpulse.app.ui.components.Pill
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.model.StorageCandidate
import com.cleanpulse.app.ui.StorageUiState
import com.cleanpulse.app.ui.components.BackTopBar
import com.cleanpulse.app.ui.components.SectionCard
import com.cleanpulse.app.ui.components.formatBytes
import com.cleanpulse.app.ui.components.formatDate
import com.cleanpulse.app.ui.components.style
import com.cleanpulse.app.ui.isDeletable
import com.cleanpulse.app.ui.theme.Emerald
import java.io.File

@Composable
fun FileReviewScreen(
    state: StorageUiState,
    initialCategory: FileCategory?,
    showBack: Boolean,
    onBack: () -> Unit,
    onToggle: (StorageCandidate) -> Unit,
    onSetAll: (FileCategory?, Boolean) -> Unit,
    onClean: () -> Unit,
    onScan: () -> Unit
) {
    var category by rememberSaveable { mutableStateOf(initialCategory) }
    val present = DASHBOARD_CATEGORIES.filter { c -> state.candidates.any { it.category == c } }
    val current = category
    val items = (if (current == null) state.candidates else state.inCategory(current)).sortedByDescending { it.size }
    val deletable = items.filter { it.isDeletable }
    val allSelected = deletable.isNotEmpty() && deletable.all { it.id in state.selectedIds }
    var confirming by remember { mutableStateOf(false) }
    val title = current?.style()?.label ?: "Review files"

    Scaffold(
        topBar = {
            val subtitle = "${deletable.size} items · ${formatBytes(deletable.sumOf { it.size })}"
            val actions: @Composable () -> Unit = {
                if (deletable.isNotEmpty()) {
                    TextButton(onClick = { onSetAll(current, !allSelected) }) {
                        Text(if (allSelected) "None" else "All")
                    }
                }
            }
            if (showBack) {
                BackTopBar(title, subtitle, onBack, actions)
            } else {
                CenterAlignedTopAppBar(
                    title = {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(title, fontWeight = FontWeight.SemiBold, fontSize = 17.sp)
                            Text(subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    },
                    actions = { actions() },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = MaterialTheme.colorScheme.background)
                )
            }
        },
        bottomBar = {
            if (state.selectedCandidates.isNotEmpty()) {
                CleanBar(state.selectedCandidates.size, state.selectedBytes, state.isCleaning) { confirming = true }
            }
        }
    ) { padding ->
        if (!state.hasResults) {
            Column(
                Modifier.fillMaxSize().padding(padding).padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text("Nothing to review yet", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text(
                    "Run a scan and the files CleanPulse finds will show up here.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.size(16.dp))
                Button(onClick = onScan) { Text("Scan storage") }
            }
            return@Scaffold
        }
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        FilterChip(current == null, { category = null }, { Text("All ${state.candidates.count { it.isDeletable }}") })
                    }
                    items(present) { c ->
                        FilterChip(current == c, { category = c }, { Text(c.style().label) })
                    }
                }
            }
            if (current != null) {
                item {
                    Text(current.style().summary, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            if (items.isEmpty()) {
                item {
                    Text(
                        "Nothing in this category.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 24.dp)
                    )
                }
            }
            if (current == FileCategory.DUPLICATES) {
                val groups = items.groupBy { it.duplicateGroupId }.values
                    .sortedByDescending { group -> group.filter { it.isDeletable }.sumOf { it.size } }
                for (group in groups) {
                    item(key = group.first().duplicateGroupId) {
                        DuplicateGroupCard(group, state.selectedIds, onToggle)
                    }
                }
            } else {
                items(items, key = { it.id }) { candidate ->
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surfaceContainer
                    ) {
                        FileRow(candidate, candidate.id in state.selectedIds, onToggle, compact = false)
                    }
                }
            }
        }
    }

    if (confirming) {
        CleanupConfirmDialog(state.selectedCandidates, onConfirm = { confirming = false; onClean() }) { confirming = false }
    }
}

@Composable
private fun DuplicateGroupCard(group: List<StorageCandidate>, selectedIds: Set<String>, onToggle: (StorageCandidate) -> Unit) {
    val copies = group.filter { it.isDeletable }
    SectionCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "${group.size} identical files",
                fontWeight = FontWeight.SemiBold,
                fontSize = 13.sp,
                modifier = Modifier.weight(1f)
            )
            Pill("${formatBytes(copies.sumOf { it.size })} reclaimable", Emerald)
        }
        Text(
            "SHA-256 ${group.first().sha256?.take(16) ?: ""}…",
            fontSize = 10.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        group.sortedBy { !it.isOriginal }.forEach { candidate ->
            FileRow(candidate, candidate.id in selectedIds, onToggle, compact = true)
        }
    }
}

@Composable
private fun FileRow(candidate: StorageCandidate, selected: Boolean, onToggle: (StorageCandidate) -> Unit, compact: Boolean) {
    val context = LocalContext.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(enabled = candidate.isDeletable) { onToggle(candidate) }
            .padding(vertical = if (compact) 4.dp else 8.dp, horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (candidate.isDeletable) {
            Checkbox(checked = selected, onCheckedChange = { onToggle(candidate) })
        } else {
            Icon(
                Icons.Outlined.Shield,
                contentDescription = "Kept",
                tint = Emerald,
                modifier = Modifier.padding(12.dp).size(24.dp)
            )
        }
        Column(Modifier.weight(1f)) {
            Text(candidate.name, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(
                displayPath(candidate.path),
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                buildString {
                    if (candidate.category != FileCategory.EMPTY_DIRS) append(formatBytes(candidate.size)).append(" · ")
                    append(formatDate(candidate.lastModified))
                },
                fontSize = 12.sp
            )
            Text(
                candidate.flagReason,
                fontSize = 11.sp,
                color = if (candidate.isOriginal) Emerald else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        if (candidate.category != FileCategory.EMPTY_DIRS && candidate.category != FileCategory.APP_CACHE) {
            IconButton(onClick = { openFile(context, candidate) }) {
                Icon(Icons.AutoMirrored.Outlined.OpenInNew, contentDescription = "Open file", tint = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Spacer(Modifier.width(2.dp))
    }
}

private fun displayPath(path: String): String =
    path.removePrefix("/storage/emulated/0").substringBeforeLast('/').ifEmpty { "/" }

private fun openFile(context: android.content.Context, candidate: StorageCandidate) {
    try {
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.files", File(candidate.path))
        val intent = Intent(Intent.ACTION_VIEW)
            .setDataAndType(uri, candidate.mimeType)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        context.startActivity(Intent.createChooser(intent, candidate.name))
    } catch (_: ActivityNotFoundException) {
    } catch (_: IllegalArgumentException) {
    }
}
