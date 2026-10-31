package com.cleanpulse.app.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Memory
import androidx.compose.material.icons.outlined.TaskAlt
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.R
import com.cleanpulse.app.ui.components.AppIcon
import com.cleanpulse.app.ui.theme.Cyan
import com.cleanpulse.app.ui.theme.Emerald
import com.cleanpulse.app.ui.theme.Slate500

@Composable
fun OnboardingScreen(onContinue: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(8.dp))
        AppIcon(80.dp)
        Spacer(Modifier.height(14.dp))
        Text("CleanPulse", fontSize = 28.sp, fontWeight = FontWeight.Bold)
        Text("smart. fresh. lived.", fontSize = 14.sp, color = Emerald)
        Text("Storage optimizer for Android", fontSize = 12.sp, color = Slate500)
        Spacer(Modifier.height(18.dp))

        Surface(
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surfaceContainerLowest,
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Emerald.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
        ) {
            Column {
                Image(
                    painter = painterResource(R.drawable.cleanpulse_logo),
                    contentDescription = "CleanPulse logo",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxWidth().height(150.dp).padding(top = 8.dp)
                )
                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.AutoAwesome, contentDescription = null, tint = Cyan, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Chunked SHA-256 hashing & Smart Suggest engine", fontSize = 12.sp)
                }
            }
        }
        Spacer(Modifier.height(16.dp))

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Guarantee(
                Icons.Outlined.VerifiedUser,
                "100% on-device",
                "No cloud uploads, analytics or trackers. All hashing and checks happen on your phone."
            )
            Guarantee(
                Icons.Outlined.TaskAlt,
                "You approve every deletion",
                "Scans need \"All files access\" to see installers and leftovers, but nothing is removed until you confirm."
            )
            Guarantee(
                Icons.Outlined.Memory,
                "No fake RAM boosters",
                "CleanPulse frees real storage. It never kills background apps or drains your battery."
            )
        }
        Spacer(Modifier.height(22.dp))
        Button(onClick = onContinue, modifier = Modifier.fillMaxWidth().height(52.dp)) {
            Text("Get started", fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.width(8.dp))
            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp))
        }
        Spacer(Modifier.height(8.dp))
        Text(
            "Works on Android 8.0 and newer",
            fontSize = 11.sp,
            color = Slate500,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun Guarantee(icon: ImageVector, title: String, body: String) {
    Surface(
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceContainer,
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp))
    ) {
        Row(Modifier.padding(14.dp)) {
            Icon(icon, contentDescription = null, tint = Emerald, modifier = Modifier.size(22.dp))
            Spacer(Modifier.width(12.dp))
            Column {
                Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                Text(body, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
