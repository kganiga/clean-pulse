package com.cleanpulse.app.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material3.Button
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.ui.CompletedCleanup
import com.cleanpulse.app.ui.components.SectionCard
import com.cleanpulse.app.ui.components.StatRow
import com.cleanpulse.app.ui.components.formatBytes
import com.cleanpulse.app.ui.components.formatDateTime
import com.cleanpulse.app.ui.theme.Amber
import com.cleanpulse.app.ui.theme.Emerald

@Composable
fun CleanupResultsScreen(cleanup: CompletedCleanup, onDone: () -> Unit, onViewHistory: () -> Unit) {
    val result = cleanup.result
    val pop = remember { Animatable(0.4f) }
    val haptics = LocalHapticFeedback.current
    LaunchedEffect(Unit) {
        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
        pop.animateTo(1f, spring(dampingRatio = Spring.DampingRatioMediumBouncy))
    }

    Column(
        Modifier
            .fillMaxSize()
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(Modifier.height(24.dp))
        Icon(
            Icons.Outlined.CheckCircle,
            contentDescription = null,
            tint = Emerald,
            modifier = Modifier.size(96.dp).scale(pop.value)
        )
        Spacer(Modifier.height(12.dp))
        Text("Cleanup complete", fontSize = 13.sp, color = Emerald, fontWeight = FontWeight.SemiBold)
        Text(formatBytes(result.bytesReclaimed), fontSize = 44.sp, fontWeight = FontWeight.Bold)
        Text(
            "freed from ${result.itemsDeletedCount} items",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(24.dp))
        SectionCard {
            StatRow("App cache", formatBytes(result.freedByAppCache))
            StatRow("Your approved files", formatBytes(result.freedByUserFiles))
            StatRow("Skipped", result.failedCount.toString(), if (result.failedCount > 0) Amber else MaterialTheme.colorScheme.onSurface)
        }
        Spacer(Modifier.height(10.dp))
        Text(
            "Saved to cleanup history · ${formatDateTime(cleanup.timestamp)}" +
                if (result.failedCount > 0) "\nSkipped items had changed since the scan or couldn't be removed." else "",
            fontSize = 11.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(28.dp))
        Button(onClick = onDone, modifier = Modifier.fillMaxWidth().height(52.dp)) {
            Icon(Icons.Outlined.Home, contentDescription = null, modifier = Modifier.size(18.dp))
            Text("  Back to dashboard", fontWeight = FontWeight.SemiBold)
        }
        Spacer(Modifier.height(10.dp))
        FilledTonalButton(onClick = onViewHistory, modifier = Modifier.fillMaxWidth().height(48.dp)) {
            Icon(Icons.Outlined.History, contentDescription = null, modifier = Modifier.size(18.dp))
            Text("  View cleanup history")
        }
    }
}
