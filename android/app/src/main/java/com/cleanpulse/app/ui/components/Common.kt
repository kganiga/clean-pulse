package com.cleanpulse.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.Android
import androidx.compose.material.icons.outlined.CleaningServices
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.FolderOff
import androidx.compose.material.icons.outlined.HourglassBottom
import androidx.compose.material.icons.outlined.PermMedia
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.R
import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.ui.theme.Amber
import com.cleanpulse.app.ui.theme.Cyan
import com.cleanpulse.app.ui.theme.Emerald

data class CategoryStyle(val label: String, val icon: ImageVector, val color: Color, val summary: String)

fun FileCategory.style(): CategoryStyle = when (this) {
    FileCategory.APP_CACHE -> CategoryStyle("App cache", Icons.Outlined.CleaningServices, Emerald,
        "Temporary data CleanPulse created")
    FileCategory.TEMP_FILES -> CategoryStyle("Temporary files", Icons.Outlined.HourglassBottom, Cyan,
        "Partial downloads, .tmp files, gallery trash")
    FileCategory.APP_APKS -> CategoryStyle("APK installers", Icons.Outlined.Android, Color(0xFF34D399),
        "Installer files left after installing apps")
    FileCategory.EMPTY_DIRS -> CategoryStyle("Empty folders", Icons.Outlined.FolderOff, Color(0xFF38BDF8),
        "Folders with nothing in them")
    FileCategory.DUPLICATES -> CategoryStyle("Duplicate files", Icons.Outlined.ContentCopy, Color(0xFFA78BFA),
        "Exact copies, one copy is always kept")
    FileCategory.OLD_DOWNLOADS -> CategoryStyle("Old downloads", Icons.Outlined.Download, Amber,
        "Files in Download you haven't touched in a while")
    FileCategory.LARGE_FILES -> CategoryStyle("Large files", Icons.Outlined.PermMedia, Color(0xFFFB923C),
        "Big videos, archives and media to review")
}

@Composable
fun AppIcon(size: Dp = 36.dp) {
    Image(
        painter = painterResource(R.drawable.cleanpulse_icon),
        contentDescription = "CleanPulse",
        modifier = Modifier
            .size(size)
            .clip(RoundedCornerShape(size * 0.28f))
            .border(1.dp, Emerald.copy(alpha = 0.3f), RoundedCornerShape(size * 0.28f))
    )
}

@Composable
fun BackTopBar(title: String, subtitle: String? = null, onBack: (() -> Unit)?, actions: @Composable () -> Unit = {}) {
    CenterAlignedTopAppBar(
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(title, fontWeight = FontWeight.SemiBold, fontSize = 17.sp)
                if (subtitle != null) {
                    Text(subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        },
        navigationIcon = {
            if (onBack != null) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                }
            }
        },
        actions = { actions() },
        colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = MaterialTheme.colorScheme.background)
    )
}

@Composable
fun SectionCard(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surfaceContainer,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        Column(Modifier.padding(16.dp)) { content() }
    }
}

@Composable
fun CategoryBadge(category: FileCategory, size: Dp = 40.dp) {
    val style = category.style()
    Box(
        modifier = Modifier
            .size(size)
            .clip(RoundedCornerShape(12.dp))
            .background(style.color.copy(alpha = 0.14f)),
        contentAlignment = Alignment.Center
    ) {
        Icon(style.icon, contentDescription = null, tint = style.color, modifier = Modifier.size(size * 0.55f))
    }
}

@Composable
fun Pill(text: String, color: Color) {
    Text(
        text,
        fontSize = 11.sp,
        fontWeight = FontWeight.Medium,
        color = color,
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(color.copy(alpha = 0.14f))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    )
}

@Composable
fun UsageRing(fraction: Float, modifier: Modifier = Modifier, stroke: Dp = 14.dp, center: @Composable () -> Unit) {
    val track = MaterialTheme.colorScheme.surfaceVariant
    val ringColor = when {
        fraction > 0.9f -> Color(0xFFF43F5E)
        fraction > 0.75f -> Amber
        else -> Emerald
    }
    Box(modifier, contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            val strokePx = stroke.toPx()
            val arcSize = Size(size.width - strokePx, size.height - strokePx)
            val topLeft = Offset(strokePx / 2, strokePx / 2)
            drawArc(track, 135f, 270f, false, topLeft, arcSize, style = Stroke(strokePx, cap = StrokeCap.Round))
            drawArc(
                Brush.linearGradient(listOf(Cyan, ringColor)),
                135f, 270f * fraction.coerceIn(0f, 1f), false, topLeft, arcSize,
                style = Stroke(strokePx, cap = StrokeCap.Round)
            )
        }
        center()
    }
}

@Composable
fun StatRow(label: String, value: String, color: Color = MaterialTheme.colorScheme.onSurface) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.width(12.dp))
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = color)
    }
}
