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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.model.StorageCandidate
import com.cleanpulse.app.ui.StorageUiState
import com.cleanpulse.app.ui.components.BackTopBar
import com.cleanpulse.app.ui.components.CategoryBadge
import com.cleanpulse.app.ui.components.Pill
import com.cleanpulse.app.ui.components.SectionCard
import com.cleanpulse.app.ui.components.formatBytes
import com.cleanpulse.app.ui.components.style
import com.cleanpulse.app.ui.isDeletable
import com.cleanpulse.app.ui.theme.Amber
import com.cleanpulse.app.ui.theme.Emerald
import com.cleanpulse.app.ui.theme.Slate500
import androidx.compose.material3.TriStateCheckbox

private val CATEGORY_ORDER = listOf(
    FileCategory.APP_CACHE,
    FileCategory.TEMP_FILES,
    FileCategory.APP_APKS,
    FileCategory.EMPTY_DIRS,
    FileCategory.DUPLICATES,
    FileCategory.OLD_DOWNLOADS,
    FileCategory.LARGE_FILES
)

@Composable
fun ScanResultsScreen(
    state: StorageUiState,
    onBack: () -> Unit,
    onOpenCategory: (FileCategory) -> Unit,
    onSetCategorySelected: (FileCategory, Boolean) -> Unit,
    onClean: () -> Unit
) {
    var confirming by remember { mutableStateOf(false) }
    val categories = CATEGORY_ORDER.filter { state.inCategory(it).isNotEmpty() }

    Scaffold(
        topBar = { BackTopBar("Scan results", "${state.candidates.count { it.isDeletable }} items found", onBack) },
        bottomBar = {
            if (state.candidates.isNotEmpty()) {
                CleanBar(state.selectedCandidates.size, state.selectedBytes, state.isCleaning) { confirming = true }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (categories.isEmpty()) {
                item {
                    SectionCard {
                        Text("All clean", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text(
                            "Nothing left to clean right now.",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            items(categories, key = { it.name }) { category ->
                val items = state.inCategory(category).filter { it.isDeletable }
                val selected = items.count { it.id in state.selectedIds }
                CategoryRow(
                    category = category,
                    count = items.size,
                    bytes = items.sumOf { it.size },
                    toggle = when (selected) {
                        0 -> ToggleableState.Off
                        items.size -> ToggleableState.On
                        else -> ToggleableState.Indeterminate
                    },
                    needsReview = items.any { !it.isSafeToDelete },
                    onToggle = { onSetCategorySelected(category, selected != items.size) },
                    onOpen = { onOpenCategory(category) }
                )
            }
        }
    }

    if (confirming) {
        CleanupConfirmDialog(state.selectedCandidates, onConfirm = { confirming = false; onClean() }) { confirming = false }
    }
}

@Composable
fun CleanupConfirmDialog(selected: List<StorageCandidate>, onConfirm: () -> Unit, onDismiss: () -> Unit) {
    val byCategory = selected.groupBy { it.category }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Delete ${selected.size} items?") },
        text = {
            Column {
                byCategory.forEach { (category, items) ->
                    Row(Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                        Text(category.style().label, fontSize = 13.sp, modifier = Modifier.weight(1f))
                        Text(formatBytes(items.sumOf { it.size }), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
                Spacer(Modifier.height(10.dp))
                Text(
                    "This frees ${formatBytes(selected.sumOf { it.size })}. Deleted files can't be recovered. " +
                        "Kept originals and files that changed since the scan are always skipped.",
                    fontSize = 12.sp
                )
            }
        },
        confirmButton = { Button(onClick = onConfirm) { Text("Delete") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun CategoryRow(
    category: FileCategory,
    count: Int,
    bytes: Long,
    toggle: ToggleableState,
    needsReview: Boolean,
    onToggle: () -> Unit,
    onOpen: () -> Unit
) {
    val style = category.style()
    Surface(
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceContainer,
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).clickable(onClick = onOpen)
    ) {
        Row(Modifier.padding(start = 4.dp, end = 12.dp, top = 12.dp, bottom = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            TriStateCheckbox(state = toggle, onClick = if (count > 0) onToggle else null)
            CategoryBadge(category)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(style.label, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    Spacer(Modifier.width(8.dp))
                    if (needsReview) Pill("Review", Amber) else Pill("Safe", Emerald)
                }
                Text(
                    if (count == 0) style.summary else "$count items · ${formatBytes(bytes)}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = "Open", tint = Slate500)
        }
    }
}

@Composable
fun CleanBar(count: Int, bytes: Long, cleaning: Boolean, onClean: () -> Unit) {
    Surface(color = MaterialTheme.colorScheme.surfaceContainerHigh) {
        Row(
            Modifier.fillMaxWidth().navigationBarsPadding().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f)) {
                Text("$count selected", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(formatBytes(bytes), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Emerald)
            }
            Button(onClick = onClean, enabled = count > 0 && !cleaning, modifier = Modifier.height(48.dp)) {
                if (cleaning) {
                    CircularProgressIndicator(Modifier.width(20.dp).height(20.dp), strokeWidth = 2.dp)
                } else {
                    Text("Clean now", fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}
