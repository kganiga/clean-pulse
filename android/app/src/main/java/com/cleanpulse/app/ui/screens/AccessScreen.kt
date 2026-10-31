package com.cleanpulse.app.ui.screens

import androidx.compose.foundation.Image
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.TouchApp
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.R
import com.cleanpulse.app.ui.components.SectionCard
import com.cleanpulse.app.ui.theme.Emerald

@Composable
fun AccessScreen(onGrant: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(12.dp))
        Image(
            painter = painterResource(R.drawable.cleanpulse_logo),
            contentDescription = "CleanPulse, smart. fresh. lived.",
            modifier = Modifier.fillMaxWidth(0.8f)
        )
        Spacer(Modifier.height(24.dp))
        Text(
            "Let CleanPulse see your storage",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "To find leftover installers, partial downloads and duplicate copies, Android requires " +
                "\"All files access\". Turn it on for CleanPulse on the next screen, then come back.",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(20.dp))
        SectionCard {
            Promise(Icons.Outlined.Lock, "Stays on your phone", "No accounts, no uploads, no analytics.")
            Promise(Icons.Outlined.TouchApp, "Nothing is deleted without you", "You review and confirm every cleanup.")
            Promise(Icons.Outlined.Shield, "Originals are protected", "For duplicates, one copy is always kept.")
        }
        Spacer(Modifier.height(24.dp))
        Button(onClick = onGrant, modifier = Modifier.fillMaxWidth().height(52.dp)) {
            Text("Allow all files access", fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun Promise(icon: ImageVector, title: String, body: String) {
    Row(Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.Start) {
        Icon(icon, contentDescription = null, tint = Emerald, modifier = Modifier.size(22.dp))
        Spacer(Modifier.width(12.dp))
        Column {
            Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Text(body, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
