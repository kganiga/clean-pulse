package com.cleanpulse.app.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material.icons.outlined.Archive
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Lightbulb
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.data.cleanup.ArchiveResult
import com.cleanpulse.app.data.local.CleanupHistoryEntity
import com.cleanpulse.app.data.repository.StorageTip
import com.cleanpulse.app.domain.SmartSuggestAction
import com.cleanpulse.app.domain.SmartSuggestSummary
import com.cleanpulse.app.ui.components.Pill
import com.cleanpulse.app.ui.components.SectionCard
import com.cleanpulse.app.ui.components.formatBytes
import com.cleanpulse.app.ui.theme.Amber
import com.cleanpulse.app.ui.theme.Cyan
import com.cleanpulse.app.ui.theme.Emerald
import com.cleanpulse.app.ui.theme.Rose
import com.cleanpulse.app.ui.theme.Slate500
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

// ---------------------------------------------------------------- Smart Suggest

@Composable
fun SmartSuggestCard(
    summary: SmartSuggestSummary?,
    isBusy: Boolean,
    lastArchive: ArchiveResult?,
    onArchive: (Set<String>) -> Unit,
    onDelete: (Set<String>) -> Unit,
    onDismissArchive: () -> Unit
) {
    if (summary == null || summary.totalDormantFiles == 0) {
        if (lastArchive != null) ArchiveDoneCard(lastArchive, onDismissArchive)
        return
    }
    var open by remember { mutableStateOf(false) }

    SectionCard(Modifier.clickable { open = true }) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.AutoAwesome, contentDescription = null, tint = Cyan)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text("Smart Suggest", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                Text(
                    "${summary.totalDormantFiles} files untouched for 90+ days",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text(formatBytes(summary.totalDormantBytes), fontWeight = FontWeight.Bold, color = Cyan)
        }
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Pill("Archive ${formatBytes(summary.archiveSuggestedBytes)}", Cyan)
            Pill("Delete ${formatBytes(summary.deleteSuggestedBytes)}", Rose)
        }
        Spacer(Modifier.height(8.dp))
        summary.suggestions.take(3).forEach { s ->
            Row(Modifier.padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    if (s.suggestedAction == SmartSuggestAction.ARCHIVE) Icons.Outlined.Archive else Icons.Outlined.Delete,
                    contentDescription = null,
                    tint = if (s.suggestedAction == SmartSuggestAction.ARCHIVE) Cyan else Rose,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(Modifier.width(8.dp))
                Text(s.name, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                Text("${s.daysDormant}d · ${formatBytes(s.size)}", fontSize = 11.sp, color = Slate500)
            }
        }
        Text("Review suggestions", fontSize = 12.sp, color = Emerald, modifier = Modifier.padding(top = 6.dp))
    }
    if (lastArchive != null) {
        Spacer(Modifier.height(12.dp))
        ArchiveDoneCard(lastArchive, onDismissArchive)
    }

    if (open) SmartSuggestSheet(summary, isBusy, onArchive, onDelete) { open = false }
}

@Composable
private fun SmartSuggestSheet(
    summary: SmartSuggestSummary,
    isBusy: Boolean,
    onArchive: (Set<String>) -> Unit,
    onDelete: (Set<String>) -> Unit,
    onClose: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var filter by remember { mutableStateOf<SmartSuggestAction?>(null) }
    var selected by remember(summary) { mutableStateOf(summary.suggestions.map { it.candidateId }.toSet()) }
    val visible = summary.suggestions.filter { filter == null || it.suggestedAction == filter }
    val chosen = summary.suggestions.filter { it.candidateId in selected }
    val archiveIds = chosen.filter { it.suggestedAction == SmartSuggestAction.ARCHIVE }.map { it.candidateId }.toSet()
    val deleteIds = chosen.filter { it.suggestedAction == SmartSuggestAction.DELETE }.map { it.candidateId }.toSet()

    ModalBottomSheet(onDismissRequest = onClose, sheetState = sheetState) {
        Column(Modifier.padding(horizontal = 16.dp)) {
            Text("Smart Suggest", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text(
                "Archive zips files into Documents/CleanPulse Archives and removes the originals. Delete removes them for good.",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(filter == null, { filter = null }, { Text("All ${summary.suggestions.size}") })
                FilterChip(filter == SmartSuggestAction.ARCHIVE, { filter = SmartSuggestAction.ARCHIVE }, { Text("Archive") })
                FilterChip(filter == SmartSuggestAction.DELETE, { filter = SmartSuggestAction.DELETE }, { Text("Delete") })
                Spacer(Modifier.weight(1f))
                TextButton(onClick = {
                    val ids = visible.map { it.candidateId }.toSet()
                    selected = if (selected.containsAll(ids)) selected - ids else selected + ids
                }) { Text("All/None") }
            }
        }
        LazyColumn(Modifier.weight(1f, fill = false).padding(horizontal = 8.dp)) {
            items(visible, key = { it.candidateId }) { s ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { selected = if (s.candidateId in selected) selected - s.candidateId else selected + s.candidateId }
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(checked = s.candidateId in selected, onCheckedChange = null, modifier = Modifier.padding(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(s.name, fontSize = 14.sp, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(s.reason, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2)
                    }
                    Column(horizontalAlignment = Alignment.End, modifier = Modifier.padding(end = 8.dp)) {
                        Text(formatBytes(s.size), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        if (s.suggestedAction == SmartSuggestAction.ARCHIVE) Pill("Archive", Cyan) else Pill("Delete", Rose)
                    }
                }
            }
        }
        Row(
            Modifier.fillMaxWidth().navigationBarsPadding().padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedButton(
                onClick = { onArchive(archiveIds); onClose() },
                enabled = archiveIds.isNotEmpty() && !isBusy,
                modifier = Modifier.weight(1f).height(48.dp)
            ) { Text("Archive ${archiveIds.size}") }
            Button(
                onClick = { onDelete(deleteIds); onClose() },
                enabled = deleteIds.isNotEmpty() && !isBusy,
                modifier = Modifier.weight(1f).height(48.dp)
            ) { Text("Delete ${deleteIds.size}") }
        }
    }
}

@Composable
private fun ArchiveDoneCard(result: ArchiveResult, onDismiss: () -> Unit) {
    SectionCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Emerald)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text("Archived ${result.archivedCount} files", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                Text(
                    "${result.archive.name} · saved ${formatBytes(result.bytesSaved)}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            TextButton(onClick = onDismiss) { Text("OK") }
        }
    }
}

// ---------------------------------------------------------------- Reclaimed chart

private data class DayPoint(val label: String, val bytes: Long, val items: Int)

private fun dailyTrend(history: List<CleanupHistoryEntity>, days: Int): List<DayPoint> {
    val fmt = SimpleDateFormat("d MMM", Locale.getDefault())
    val dayKey = { millis: Long ->
        Calendar.getInstance().apply { timeInMillis = millis }.let { it.get(Calendar.YEAR) * 1000 + it.get(Calendar.DAY_OF_YEAR) }
    }
    val byDay = history.groupBy { dayKey(it.timestamp) }
    return (days - 1 downTo 0).map { back ->
        val cal = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -back) }
        val records = byDay[dayKey(cal.timeInMillis)].orEmpty()
        DayPoint(fmt.format(cal.time), records.sumOf { it.bytesReclaimed }, records.sumOf { it.itemsCount })
    }
}

@Composable
fun ReclaimedStorageChart(history: List<CleanupHistoryEntity>, onOpenHistory: () -> Unit) {
    var range by remember { mutableIntStateOf(30) }
    val points = remember(history, range) { dailyTrend(history, range) }
    val total = points.sumOf { it.bytes }
    val activeDays = points.count { it.bytes > 0 }
    val peak = points.maxByOrNull { it.bytes }
    val track = MaterialTheme.colorScheme.surfaceVariant

    SectionCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.AutoMirrored.Outlined.TrendingUp, contentDescription = null, tint = Emerald)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text("Storage reclaimed", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                Text("Daily cleanups over $range days", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Row(Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            listOf(7, 14, 30).forEach { d -> FilterChip(range == d, { range = d }, { Text("${d}d", fontSize = 12.sp) }) }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Kpi("Reclaimed", formatBytes(total), Emerald)
            Kpi("Active days", "$activeDays")
            Kpi("Peak", if (peak == null || peak.bytes == 0L) "–" else formatBytes(peak.bytes))
        }
        Spacer(Modifier.height(12.dp))
        val max = (points.maxOfOrNull { it.bytes } ?: 0L).coerceAtLeast(1L)
        Canvas(Modifier.fillMaxWidth().height(110.dp)) {
            val slot = size.width / points.size
            val barWidth = (slot * 0.62f).coerceAtLeast(2f)
            points.forEachIndexed { i, p ->
                val x = i * slot + (slot - barWidth) / 2
                drawRoundRect(track, Offset(x, size.height - 3f), Size(barWidth, 3f), CornerRadius(2f))
                if (p.bytes > 0) {
                    val h = (p.bytes.toFloat() / max * (size.height - 4f)).coerceAtLeast(4f)
                    drawRoundRect(
                        if (p == peak) Cyan else Emerald,
                        Offset(x, size.height - h),
                        Size(barWidth, h),
                        CornerRadius(barWidth / 3)
                    )
                }
            }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(points.first().label, fontSize = 10.sp, color = Slate500)
            Text("Today", fontSize = 10.sp, color = Slate500)
        }
        if (total == 0L) {
            Text(
                "No cleanups in this period yet.",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 6.dp)
            )
        }
        TextButton(onClick = onOpenHistory, contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)) {
            Text("Open full history")
        }
    }
}

@Composable
private fun Kpi(label: String, value: String, color: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface) {
    Column {
        Text(label, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = color)
    }
}

// ---------------------------------------------------------------- Tips

@Composable
fun StorageTipsCard(tips: List<StorageTip>, startIndex: Int) {
    if (tips.isEmpty()) return
    var index by remember { mutableIntStateOf(startIndex) }
    var expanded by remember { mutableStateOf(false) }
    LaunchedEffect(index) { expanded = false }
    val tip = tips[index]

    SectionCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.Lightbulb, contentDescription = null, tint = Amber)
            Spacer(Modifier.width(10.dp))
            Text("Storage tip", fontWeight = FontWeight.SemiBold, fontSize = 15.sp, modifier = Modifier.weight(1f))
            Pill(tip.category, Amber)
        }
        Spacer(Modifier.height(10.dp))
        Text(tip.title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
        Text(tip.tagline, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text("Could free ${tip.potentialSavings}", fontSize = 12.sp, color = Emerald, modifier = Modifier.padding(top = 4.dp))
        if (expanded) {
            Spacer(Modifier.height(8.dp))
            Text(tip.description, fontSize = 12.sp)
            Spacer(Modifier.height(6.dp))
            tip.steps.forEachIndexed { i, step ->
                Text("${i + 1}. $step", fontSize = 12.sp, modifier = Modifier.padding(vertical = 2.dp))
            }
            if (tip.systemSettingPath.isNotBlank()) {
                Text(tip.systemSettingPath, fontSize = 11.sp, color = Slate500, modifier = Modifier.padding(top = 4.dp))
            }
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = { expanded = !expanded }, contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)) {
                Text(if (expanded) "Hide steps" else "Show steps")
            }
            Spacer(Modifier.weight(1f))
            IconButton(onClick = { index = (index - 1 + tips.size) % tips.size }) {
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowLeft, contentDescription = "Previous tip")
            }
            Text("${index + 1}/${tips.size}", fontSize = 12.sp, color = Slate500)
            IconButton(onClick = { index = (index + 1) % tips.size }) {
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = "Next tip")
            }
        }
    }
}
