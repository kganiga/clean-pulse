package com.cleanpulse.app.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.R
import com.cleanpulse.app.data.model.ScanPhase
import com.cleanpulse.app.data.model.ScanProgressState
import com.cleanpulse.app.ui.components.SectionCard
import com.cleanpulse.app.ui.components.StatRow
import com.cleanpulse.app.ui.components.formatBytes

@Composable
fun ScanProgressScreen(progress: ScanProgressState, onCancel: () -> Unit) {
    val pulse by rememberInfiniteTransition(label = "pulse").animateFloat(
        initialValue = 0.94f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(tween(700), RepeatMode.Reverse),
        label = "scale"
    )
    Column(
        modifier = Modifier.fillMaxSize().safeDrawingPadding().padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Image(
            painter = painterResource(R.drawable.cleanpulse_icon),
            contentDescription = null,
            modifier = Modifier.size(120.dp).scale(pulse).clip(RoundedCornerShape(32.dp))
        )
        Spacer(Modifier.height(28.dp))
        Text(
            when (progress.phase) {
                ScanPhase.HASHING_DUPLICATES -> "Checking for exact duplicates"
                else -> "Scanning your storage"
            },
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold
        )
        Spacer(Modifier.height(6.dp))
        Text(
            progress.currentPath.ifEmpty { "Starting…" },
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(20.dp))
        if (progress.phase == ScanPhase.HASHING_DUPLICATES && progress.totalEstimatedFiles > 0) {
            LinearProgressIndicator(
                progress = { progress.progressPercent },
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp))
            )
        } else {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)))
        }
        Spacer(Modifier.height(20.dp))
        SectionCard {
            StatRow("Files checked", "%,d".format(progress.filesScanned))
            StatRow("Data examined", formatBytes(progress.bytesExamined))
            StatRow(
                "Step",
                if (progress.phase == ScanPhase.HASHING_DUPLICATES) "2 of 2 · duplicates" else "1 of 2 · indexing"
            )
        }
        Spacer(Modifier.height(24.dp))
        OutlinedButton(onClick = onCancel) { Text("Cancel scan") }
    }
}
